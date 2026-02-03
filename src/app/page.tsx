'use client'

import { useW3 } from '@storacha/ui-react'
import DashboardLayout from '../components/DashboardLayout'
import { useAccountUsage } from '../hooks/useAccountUsage'
import { useAccountEgress } from '../hooks/useAccountEgress'
import { getLastMonthPeriod, formatDate, bytesToTiB } from '../lib/formatting'
import { STORAGE_USD_PER_TIB, EGRESS_USD_PER_TIB } from '../lib/services'
import { calculateTotalInvoice, formatPrice } from '../lib/pricing'

export default function InvoicingPage() {
  const [{ accounts }] = useW3()
  const account = accounts[0]
  const accountDID = account?.did()

  const period = getLastMonthPeriod()

  const { data: usageData, isLoading: usageLoading, error: usageError } = useAccountUsage(accountDID)
  const { data: egressData, isLoading: egressLoading, error: egressError } = useAccountEgress(accountDID, period)

  const isLoading = usageLoading || egressLoading
  const error = usageError || egressError

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hot-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Loading invoice data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-bold mb-2">Error Loading Data</h2>
          <p className="text-red-700">{error.message}</p>
        </div>
      </DashboardLayout>
    )
  }

  const storageBytes = usageData?.total ?? 0
  const egressBytes = egressData?.total ?? 0

  console.log('Egress data:', egressData)

  const invoice = calculateTotalInvoice(storageBytes, egressBytes)

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Monthly Invoice</h2>

        {/* Period Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Billing Period</h3>
          <p className="text-gray-600">
            {formatDate(period.from)} - {formatDate(period.to)}
          </p>
        </div>

        {/* Invoice Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-hot-blue text-white">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Line Item</th>
                <th className="px-6 py-4 text-right font-semibold">Quantity</th>
                <th className="px-6 py-4 text-right font-semibold">Unit Price</th>
                <th className="px-6 py-4 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Storage Line Item */}
              <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-800">Storage Use</td>
                <td className="px-6 py-4 text-right font-mono text-gray-700">
                  {invoice.storageTiB.toFixed(3)} TiB
                </td>
                <td className="px-6 py-4 text-right text-gray-700">
                  ${STORAGE_USD_PER_TIB.toFixed(2)}/TiB/month
                </td>
                <td className="px-6 py-4 text-right font-semibold text-gray-900">
                  {formatPrice(invoice.storageAmount)}
                </td>
              </tr>

              {/* Egress Line Item */}
              <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-800">Egress</td>
                <td className="px-6 py-4 text-right font-mono text-gray-700">
                  {invoice.egressTiB.toFixed(3)} TiB
                </td>
                <td className="px-6 py-4 text-right text-gray-700">
                  ${EGRESS_USD_PER_TIB.toFixed(2)}/TiB
                </td>
                <td className="px-6 py-4 text-right font-semibold text-gray-900">
                  {formatPrice(invoice.egressAmount)}
                </td>
              </tr>

              {/* Total */}
              <tr className="bg-hot-blue-light">
                <td colSpan={3} className="px-6 py-4 text-right font-bold text-gray-800">
                  Total Amount Due
                </td>
                <td className="px-6 py-4 text-right font-bold text-hot-blue text-xl">
                  {formatPrice(invoice.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notes */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> This invoice is for informational purposes. You will receive an official invoice via email for payment.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
