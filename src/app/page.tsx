'use client'

import { useState, useMemo } from 'react'
import { useW3 } from '@storacha/ui-react'
import DashboardLayout from '../components/DashboardLayout'
import { useAccountUsage } from '../hooks/useAccountUsage'
import { useAccountEgress } from '../hooks/useAccountEgress'
import { getLastMonthPeriod, formatDate, formatBytesAuto } from '../lib/formatting'
import { STORAGE_USD_PER_TIB, EGRESS_USD_PER_TIB } from '../lib/services'
import { calculateTotalInvoice, formatPrice } from '../lib/pricing'
import type { Period } from '../types'

/**
 * Format date to YYYY-MM-DD for input[type="date"]
 */
function toInputDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Get start of day (midnight) for a date
 */
function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get end of day (23:59:59.999) for a date
 */
function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export default function InvoicingPage() {
  const [{ accounts }] = useW3()
  const account = accounts[0]
  const accountDID = account?.did()

  // Default period: last month
  const defaultPeriod = getLastMonthPeriod()

  // Date picker state - use start of day to avoid precision issues
  const [fromDate, setFromDate] = useState<Date>(startOfDay(defaultPeriod.from))
  const [toDate, setToDate] = useState<Date>(startOfDay(defaultPeriod.to))

  const period: Period = useMemo(() => ({
    from: startOfDay(fromDate),
    to: startOfDay(toDate),  // Use start of day to avoid exceeding delegation constraint
  }), [fromDate, toDate])

  // Fetch data
  const { data: usageData, isLoading: usageLoading, error: usageError } = useAccountUsage(accountDID)
  const { data: egressData, isLoading: egressLoading, error: egressError } = useAccountEgress(accountDID, period)

  // Filter usage data by selected period (client-side)
  const filteredStorageBytes = useMemo(() => {
    if (!usageData?.daily || usageData.daily.length === 0) {
      return usageData?.total ?? 0
    }

    // Filter daily snapshots to selected period
    const filteredSnapshots = usageData.daily.filter(snapshot => {
      const snapshotDate = new Date(snapshot.date)
      return snapshotDate >= fromDate && snapshotDate <= toDate
    })

    if (filteredSnapshots.length === 0) {
      // No data in selected period, return 0
      return 0
    }

    // Use the last snapshot's value in the period (storage at end of period)
    return filteredSnapshots[filteredSnapshots.length - 1].bytes
  }, [usageData, fromDate, toDate])

  const isLoading = usageLoading || egressLoading
  const error = usageError || egressError

  // Handle date changes
  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value)
    if (!isNaN(newDate.getTime())) {
      setFromDate(startOfDay(newDate))
    }
  }

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value)
    if (!isNaN(newDate.getTime())) {
      setToDate(startOfDay(newDate))
    }
  }

  // Quick period selection
  const setThisMonth = () => {
    const now = new Date()
    setFromDate(startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)))
    setToDate(startOfDay(now))
  }

  const setLastMonth = () => {
    const period = getLastMonthPeriod()
    setFromDate(startOfDay(period.from))
    setToDate(startOfDay(period.to))
  }

  const setLast30Days = () => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    setFromDate(startOfDay(thirtyDaysAgo))
    setToDate(startOfDay(now))
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

  const storageBytes = filteredStorageBytes
  const egressBytes = egressData?.total ?? 0
  const invoice = calculateTotalInvoice(storageBytes, egressBytes)

  // Auto-format storage and egress for display
  const storageDisplay = formatBytesAuto(storageBytes)
  const egressDisplay = formatBytesAuto(egressBytes)

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        {/* Page Title */}
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
                {/* From Date */}
                <div className="flex items-center gap-2">
                  <label htmlFor="fromDate" className="text-sm text-gray-600">From:</label>
                  <input
                    type="date"
                    id="fromDate"
                    value={toInputDateString(fromDate)}
                    onChange={handleFromDateChange}
                    max={toInputDateString(toDate)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hot-blue/20 focus:border-hot-blue"
                  />
                </div>

                <span className="text-gray-400">—</span>

                {/* To Date */}
                <div className="flex items-center gap-2">
                  <label htmlFor="toDate" className="text-sm text-gray-600">To:</label>
                  <input
                    type="date"
                    id="toDate"
                    value={toInputDateString(toDate)}
                    onChange={handleToDateChange}
                    min={toInputDateString(fromDate)}
                    max={toInputDateString(new Date())}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hot-blue/20 focus:border-hot-blue"
                  />
                </div>
              </div>

              {/* Quick selection buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={setLastMonth}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Last Month
                </button>
                <button
                  onClick={setThisMonth}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  This Month
                </button>
                <button
                  onClick={setLast30Days}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Last 30 Days
                </button>
              </div>
            </div>

            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900 mb-2">
                {formatDate(period.from)} — {formatDate(period.to)}
              </p>
              <button className="px-5 py-2.5 bg-hot-blue text-white text-sm font-medium rounded-xl hover:bg-hot-blue-dark transition-colors shadow-sm">
                Check Billing
              </button>
            </div>
          </div>
        </div>

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
                {/* Storage Line Item */}
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
                    {storageDisplay.value.toFixed(3)} {storageDisplay.unit}
                  </td>
                  <td className="px-6 py-5 text-right text-sm text-gray-500">
                    ${STORAGE_USD_PER_TIB.toFixed(2)}/TiB/month
                  </td>
                  <td className="px-6 py-5 text-right font-semibold text-gray-900">
                    {formatPrice(invoice.storageAmount)}
                  </td>
                </tr>

                {/* Egress Line Item */}
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
                    {egressDisplay.value.toFixed(3)} {egressDisplay.unit}
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