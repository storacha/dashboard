'use client'

import { useMemo } from 'react'
import { useW3 } from '@storacha/ui-react'
import Authenticator from '../components/Authenticator'
import { usePlan } from '../hooks/usePlan'
import { useAccountUsage } from '../hooks/useAccountUsage'
import { useAccountEgress } from '../hooks/useAccountEgress'
import { STORAGE_USD_PER_TIB, EGRESS_USD_PER_TIB } from '../lib/services'

export default function Dashboard() {
  const [{ accounts }] = useW3()
  const account = accounts[0]
  const accountDID = account?.did()

  // Create period from first of last complete month to first of current month
  // Memoize to prevent continuous re-renders
  const period = useMemo(() => {
    const now = new Date()
    const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return {
      from: firstDayOfLastMonth,
      to: firstDayOfCurrentMonth
    }
  }, []) // Empty deps array means this only runs once

  const { data: planData, isLoading: planLoading, error: planError } = usePlan(accountDID)
  const { data: usageData, isLoading: usageLoading, error: usageError } = useAccountUsage(accountDID)
  const { data: egressData, isLoading: egressLoading, error: egressError } = useAccountEgress(accountDID, period)

  // Debug logging
  console.log('Dashboard state:', {
    accountDID,
    planData,
    planLoading,
    planError,
    usageData: usageData?.total,
    usageLoading,
    usageError,
    egressData,
    egressLoading,
    egressError
  })

  const isLoading = planLoading || usageLoading || egressLoading
  const error = planError || usageError || egressError

  return (
    <Authenticator>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-hot-blue mb-8">Storacha Customer Dashboard</h1>

          {/* Account Info */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Account</h2>
            <p className="font-mono text-sm">{accountDID}</p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <p>Loading data...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
              <p className="text-red-600">{error.message}</p>
            </div>
          )}

          {/* Plan Data */}
          {planData && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Plan (plan/get)</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">Limit (bytes)</td>
                      <td className="px-6 py-4 font-mono">{planData.limit.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">Limit (TiB)</td>
                      <td className="px-6 py-4 font-mono">{(planData.limit / (1024 ** 4)).toFixed(4)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Usage Data */}
          {usageData && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Storage Usage (account/usage/get)</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bytes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TiB</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">USD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">Total Storage</td>
                      <td className="px-6 py-4 font-mono">{usageData.total.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono">{(usageData.total / (1024 ** 4)).toFixed(4)}</td>
                      <td className="px-6 py-4 font-mono">${((usageData.total / (1024 ** 4)) * STORAGE_USD_PER_TIB).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-semibold mt-6 mb-4">Raw Response</h3>
              <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-xs">
                {JSON.stringify(usageData.raw, null, 2)}
              </pre>
            </div>
          )}

          {/* Egress Data */}
          {egressLoading && !egressData && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Egress (account/egress/get)</h2>
              <p className="text-gray-600">Loading egress data...</p>
            </div>
          )}
          {egressError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-red-700 mb-2">Egress Error</h2>
              <p className="text-red-600">{egressError.message}</p>
              {(egressError as any).ucanto && (
                <pre className="text-xs mt-2 text-red-600 bg-red-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify((egressError as any).ucanto, null, 2)}
                </pre>
              )}
            </div>
          )}
          {egressData && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Egress (account/egress/get)</h2>

              {(egressData as any).total !== undefined && (
                <div className="overflow-x-auto mb-6">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bytes</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TiB</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">USD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">Total Egress</td>
                        <td className="px-6 py-4 font-mono">{((egressData as any).total || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 font-mono">{(((egressData as any).total || 0) / (1024 ** 4)).toFixed(4)}</td>
                        <td className="px-6 py-4 font-mono">${((((egressData as any).total || 0) / (1024 ** 4)) * EGRESS_USD_PER_TIB).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <h3 className="text-lg font-semibold mt-6 mb-4">Raw Response</h3>
              <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-xs">
                {JSON.stringify(egressData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </Authenticator>
  )
}
