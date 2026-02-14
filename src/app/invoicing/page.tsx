'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useW3 } from '@storacha/ui-react'
import { useSearchParams, useRouter } from 'next/navigation'
import DashboardLayout from '../../components/DashboardLayout'
import { useAccountUsage } from '../../hooks/useAccountUsage'
import { useAccountEgress } from '../../hooks/useAccountEgress'
import { formatDate, formatBytesAuto } from '../../lib/formatting'
import { STORAGE_USD_PER_TIB, EGRESS_USD_PER_TIB } from '../../lib/services'
import { calculateTotalInvoice, formatPrice } from '../../lib/pricing'
import type { Period } from '../../types'

/**
 * Format date to YYYY-MM-DD string (UTC)
 */
function toDateString(date: Date): string {
    return date.toISOString().split('T')[0]
}

/**
 * Get last 30 days period: now minus 30 days → now
 */
function getLast30DaysPeriod() {
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return { from: thirtyDaysAgo, to: now }
}

/**
 * Get last month period
 */
function getLastMonthPeriod() {
    const now = new Date()
    const firstOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const firstOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
    return { from: firstOfLastMonth, to: firstOfThisMonth }
}

/**
 * Get this month period: first of month → now
 */
function getThisMonthPeriod() {
    const now = new Date()
    const firstOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    return { from: firstOfThisMonth, to: now }
}

export default function InvoicingPage() {
    const [{ accounts }] = useW3()
    const account = accounts[0]
    const accountDID = account?.did()
    const searchParams = useSearchParams()
    const router = useRouter()

    // Read dates from URL params, default to last 30 days
    const defaultPeriod = getLast30DaysPeriod()
    const initialFrom = searchParams.get('from') || toDateString(defaultPeriod.from)
    const initialTo = searchParams.get('to') || toDateString(defaultPeriod.to)

    // State stores YYYY-MM-DD strings — no timezone ambiguity
    const [fromStr, setFromStr] = useState<string>(initialFrom)
    const [toStr, setToStr] = useState<string>(initialTo)

    // Sync URL params when dates change
    const updateURL = useCallback((from: string, to: string) => {
        const params = new URLSearchParams()
        params.set('from', from)
        params.set('to', to)
        router.replace(`/invoicing?${params.toString()}`, { scroll: false })
    }, [router])

    useEffect(() => {
        updateURL(fromStr, toStr)
    }, [fromStr, toStr, updateURL])

    // Check if date range is valid before doing anything
    const isValidPeriod = fromStr < toStr

    // Build period for egress API call — both midnight UTC, no delegation overflow
    const period: Period | null = useMemo(() => {
        if (!isValidPeriod) return null
        const from = new Date(fromStr + 'T00:00:00Z')
        const to = new Date(toStr + 'T00:00:00Z')
        return { from, to }
    }, [fromStr, toStr, isValidPeriod])

    // Fetch data — egress only fires when period is valid
    const { data: usageData, isLoading: usageLoading, error: usageError } = useAccountUsage(accountDID)
    const { data: egressData, isLoading: egressLoading, error: egressError } = useAccountEgress(
        accountDID,
        period ?? undefined
    )

    // Filter storage: find the last snapshot on or before toDate
    // This = "how much storage exists at end of selected period"
    const filteredStorageBytes = useMemo(() => {
        if (!usageData?.daily || usageData.daily.length === 0) {
            return usageData?.total ?? 0
        }

        // All comparisons as YYYY-MM-DD strings — no timezone issues
        const fromKey = fromStr
        const toKey = toStr

        // First try: snapshots within the selected range
        const inRange = usageData.daily.filter(snapshot => {
            const key = toDateString(snapshot.date)
            return key >= fromKey && key <= toKey
        })

        if (inRange.length > 0) {
            // Last snapshot in range = storage at end of period
            return inRange[inRange.length - 1].bytes
        }

        // No snapshots in range — carry forward the most recent snapshot before the range
        // (storage doesn't disappear just because there was no activity)
        const before = usageData.daily.filter(snapshot => {
            const key = toDateString(snapshot.date)
            return key < fromKey
        })

        if (before.length > 0) {
            return before[before.length - 1].bytes
        }

        return 0
    }, [usageData, fromStr, toStr])

    const isLoading = usageLoading || (isValidPeriod && egressLoading)
    const error = usageError || (isValidPeriod ? egressError : null)

    // Date change handlers — work with strings directly
    const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) setFromStr(e.target.value)
    }

    const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) setToStr(e.target.value)
    }

    // Quick period presets
    const setPreset = (getter: () => { from: Date; to: Date }) => {
        const p = getter()
        setFromStr(toDateString(p.from))
        setToStr(toDateString(p.to))
    }

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-hot-blue/20 border-t-hot-blue rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-500 text-sm">Loading invoice data...</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                    <h2 className="text-red-800 font-semibold mb-2">Error Loading Data</h2>
                    <p className="text-red-600 text-sm">{error.message}</p>
                </div>
            </DashboardLayout>
        )
    }

    const storageBytes = isValidPeriod ? filteredStorageBytes : 0
    const egressBytes = isValidPeriod ? (egressData?.total ?? 0) : 0
    const invoice = calculateTotalInvoice(storageBytes, egressBytes)

    const storageDisplay = formatBytesAuto(storageBytes)
    const egressDisplay = formatBytesAuto(egressBytes)

    const todayStr = toDateString(new Date())

    return (
        <DashboardLayout>
            <div className="max-w-5xl">
                <h1 className="text-2xl font-bold text-hot-blue mb-8">Invoicing</h1>

                {/* Metrics Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {/* Storage Used Card */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-hot-blue-light flex items-center justify-center">
                                <svg className="w-5 h-5 text-hot-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                            </div>
                            <span className="text-sm text-gray-500 font-medium">Storage Used</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {storageDisplay.value.toFixed(2)} <span className="text-base font-medium text-gray-400">{storageDisplay.unit}</span>
                        </div>
                    </div>

                    {/* Egress Used Card */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-hot-blue-light flex items-center justify-center">
                                <svg className="w-5 h-5 text-hot-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <span className="text-sm text-gray-500 font-medium">Egress Used</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {egressDisplay.value.toFixed(2)} <span className="text-base font-medium text-gray-400">{egressDisplay.unit}</span>
                        </div>
                    </div>

                    {/* Storage Cost Card */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="text-sm text-gray-500 font-medium">Storage Cost</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {formatPrice(invoice.storageAmount)}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">USD/Month</p>
                    </div>

                    {/* Total Due Card */}
                    <div className="bg-hot-blue rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                                </svg>
                            </div>
                            <span className="text-sm text-white/80 font-medium">Total Due</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {formatPrice(invoice.total)}
                        </div>
                        <p className="text-xs text-white/60 mt-1">This billing period</p>
                    </div>
                </div>

                {/* Billing Period with Date Picker */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Billing Period</h3>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <label htmlFor="fromDate" className="text-sm text-gray-600">From:</label>
                                    <input
                                        type="date"
                                        id="fromDate"
                                        value={fromStr}
                                        onChange={handleFromDateChange}
                                        max={todayStr}
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hot-blue/20 focus:border-hot-blue"
                                    />
                                </div>

                                <span className="text-gray-400">—</span>

                                <div className="flex items-center gap-2">
                                    <label htmlFor="toDate" className="text-sm text-gray-600">To:</label>
                                    <input
                                        type="date"
                                        id="toDate"
                                        value={toStr}
                                        onChange={handleToDateChange}
                                        max={todayStr}
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hot-blue/20 focus:border-hot-blue"
                                    />
                                </div>
                            </div>

                            {/* Quick selection buttons */}
                            <div className="flex flex-wrap gap-2 mt-3">
                                <button
                                    onClick={() => setPreset(getLast30DaysPeriod)}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Last 30 Days
                                </button>
                                <button
                                    onClick={() => setPreset(getThisMonthPeriod)}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    This Month
                                </button>
                                <button
                                    onClick={() => setPreset(getLastMonthPeriod)}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Last Month
                                </button>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900 mb-2">
                                {formatDate(fromStr)} — {formatDate(toStr)}
                            </p>
                            <button className="px-5 py-2.5 bg-hot-blue text-white text-sm font-medium rounded-xl hover:bg-hot-blue-dark transition-colors shadow-sm">
                                Check Billing
                            </button>
                        </div>
                    </div>
                </div>

                {/* Invalid period message */}
                {!isValidPeriod && (
                    <div className="bg-hot-yellow-light border border-hot-yellow rounded-2xl p-5 mb-6">
                        <div className="flex gap-3 items-center">
                            <span className="text-2xl">📅</span>
                            <p className="text-sm text-gray-700">
                                <span className="font-semibold">Heads up!</span> Your &quot;From&quot; date is on or after your &quot;To&quot; date. Pick a &quot;From&quot; that comes before &quot;To&quot; and we&apos;ll crunch the numbers.
                            </p>
                        </div>
                    </div>
                )}

                {/* Invoice Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Invoice Details</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Line Item</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit Price</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-hot-blue-light flex items-center justify-center">
                                                <svg className="w-4 h-4 text-hot-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                                </svg>
                                            </div>
                                            <span className="font-medium text-gray-900">Storage Use</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right font-mono text-sm text-gray-700">
                                        {storageDisplay.value.toFixed(2)} {storageDisplay.unit}
                                    </td>
                                    <td className="px-6 py-5 text-right text-sm text-gray-500">
                                        ${STORAGE_USD_PER_TIB.toFixed(2)}/TiB/month
                                    </td>
                                    <td className="px-6 py-5 text-right font-semibold text-gray-900">
                                        {formatPrice(invoice.storageAmount)}
                                    </td>
                                </tr>

                                <tr className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-hot-blue-light flex items-center justify-center">
                                                <svg className="w-4 h-4 text-hot-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                            </div>
                                            <span className="font-medium text-gray-900">Egress</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right font-mono text-sm text-gray-700">
                                        {egressDisplay.value.toFixed(2)} {egressDisplay.unit}
                                    </td>
                                    <td className="px-6 py-5 text-right text-sm text-gray-500">
                                        ${EGRESS_USD_PER_TIB.toFixed(2)}/TiB
                                    </td>
                                    <td className="px-6 py-5 text-right font-semibold text-gray-900">
                                        {formatPrice(invoice.egressAmount)}
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr className="bg-hot-blue-light/50">
                                    <td colSpan={3} className="px-6 py-5 text-right font-semibold text-gray-700">
                                        Total Amount Due
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <span className="text-xl font-bold text-hot-blue">{formatPrice(invoice.total)}</span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Note */}
                <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-5">
                    <div className="flex gap-3">
                        <svg className="w-5 h-5 text-hot-blue flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium text-gray-700">Note:</span> This invoice is for informational purposes. You will receive an official invoice via email for payment.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}