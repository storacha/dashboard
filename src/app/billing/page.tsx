'use client'

import { useState, useMemo } from 'react'
import { useW3 } from '@storacha/ui-react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAccountUsage } from '../../hooks/useAccountUsage'
import { useAccountEgress } from '../../hooks/useAccountEgress'
import { calculateTotalInvoice, formatPrice } from '../../lib/pricing'
import type { Period, DailySnapshot } from '../../types'

const INVOICES_PER_PAGE = 10
const MONTHS_OF_HISTORY = 24

function getMonthPeriod(year: number, month: number): Period {
  const from = new Date(Date.UTC(year, month, 1))
  const to = new Date(Date.UTC(year, month + 1, 1))
  return { from, to }
}

function formatMonthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 1)).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function generatePastMonths(count: number): Array<{ year: number; month: number }> {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1 - i, 1))
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() }
  })
}

function getStorageBytesForPeriod(daily: DailySnapshot[], period: Period): number {
  const fromKey = period.from.toISOString().split('T')[0]
  const toKey = period.to.toISOString().split('T')[0]
  const inRange = daily.filter(s => {
    const k = s.date.toISOString().split('T')[0]
    return k >= fromKey && k < toKey
  })
  if (inRange.length > 0) return inRange[inRange.length - 1].bytes
  const before = daily.filter(s => s.date.toISOString().split('T')[0] < fromKey)
  return before.length > 0 ? before[before.length - 1].bytes : 0
}

function InvoiceRow({
  year,
  month,
  accountDID,
  daily,
}: {
  year: number
  month: number
  accountDID?: string
  daily?: DailySnapshot[]
}) {
  const period = useMemo(() => getMonthPeriod(year, month), [year, month])
  const { data: egressData, isLoading } = useAccountEgress(accountDID, period)

  const storageBytes = useMemo(() => {
    if (!daily || daily.length === 0) return 0
    return getStorageBytesForPeriod(daily, period)
  }, [daily, period])

  const invoice = calculateTotalInvoice(storageBytes, egressData?.total ?? 0)

  return (
    <tr className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
      <td className="px-6 py-2.5 text-sm text-gray-700">{formatMonthLabel(year, month)}</td>
      <td className="px-6 py-2.5 text-sm text-gray-400">—</td>
      <td className="px-6 py-2.5 text-sm font-medium text-gray-900">
        {isLoading ? (
          <span className="inline-block w-14 h-4 bg-gray-100 rounded animate-pulse" />
        ) : (
          formatPrice(invoice.total)
        )}
      </td>
      <td className="px-6 py-2.5 text-sm text-gray-400">—</td>
      <td className="px-6 py-2.5 text-right">
        <button
          disabled
          className="px-3 py-1 text-xs font-medium text-hot-blue border border-hot-blue/40 rounded-full hover:bg-hot-blue-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Download
        </button>
      </td>
    </tr>
  )
}

export default function BillingPage() {
  const [{ accounts }] = useW3()
  const account = accounts[0]
  const accountDID = account?.did()

  const [page, setPage] = useState(0)

  const currentMonthPeriod = useMemo(() => {
    const now = new Date()
    return getMonthPeriod(now.getUTCFullYear(), now.getUTCMonth())
  }, [])

  const { data: usageData, isLoading: usageLoading } = useAccountUsage(accountDID)
  const { data: currentEgressData, isLoading: egressLoading } = useAccountEgress(
    accountDID,
    currentMonthPeriod
  )

  const allPastMonths = useMemo(() => generatePastMonths(MONTHS_OF_HISTORY), [])
  const totalPages = Math.ceil(allPastMonths.length / INVOICES_PER_PAGE)
  const pageMonths = allPastMonths.slice(page * INVOICES_PER_PAGE, (page + 1) * INVOICES_PER_PAGE)

  const currentMonthStorageBytes = useMemo(() => {
    if (!usageData?.daily || usageData.daily.length === 0) return usageData?.total ?? 0
    return getStorageBytesForPeriod(usageData.daily, currentMonthPeriod)
  }, [usageData, currentMonthPeriod])

  const currentMonthInvoice = calculateTotalInvoice(
    currentMonthStorageBytes,
    currentEgressData?.total ?? 0
  )

  const isHeaderLoading = usageLoading || egressLoading

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-hot-blue">Billing</h1>
          <button className="px-5 py-2.5 bg-hot-blue text-white text-sm font-medium rounded-full hover:bg-hot-blue-dark transition-colors shadow-sm">
            Contact Account Manager
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Storage Cost Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Storage</h3>
                <p className="text-xs text-gray-500">Accrued Cost this Month</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-hot-blue-light flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-hot-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
            </div>
            {isHeaderLoading ? (
              <div className="h-8 w-24 bg-gray-100 rounded animate-pulse mt-2" />
            ) : (
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatPrice(currentMonthInvoice.storageAmount)}
              </p>
            )}
          </div>

          {/* Egress Cost Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Egress</h3>
                <p className="text-xs text-gray-500">Accrued Cost this Month</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-hot-blue-light flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-hot-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>
            {isHeaderLoading ? (
              <div className="h-8 w-24 bg-gray-100 rounded animate-pulse mt-2" />
            ) : (
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatPrice(currentMonthInvoice.egressAmount)}
              </p>
            )}
          </div>
        </div>

        {/* Invoice History Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Invoice History</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-hot-blue">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-hot-blue">Invoice ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-hot-blue">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-hot-blue">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-hot-blue">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageMonths.map(({ year, month }) => (
                  <InvoiceRow
                    key={`${year}-${month}`}
                    year={year}
                    month={month}
                    accountDID={accountDID}
                    daily={usageData?.daily}
                  />
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}
