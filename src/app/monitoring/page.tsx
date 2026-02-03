'use client'

import { useW3 } from '@storacha/ui-react'
import DashboardLayout from '../../components/DashboardLayout'
import CapacityBar from '../../components/CapacityBar'
import { useAccountUsage } from '../../hooks/useAccountUsage'
import { useAccountEgress } from '../../hooks/useAccountEgress'
import { usePlan } from '../../hooks/usePlan'
import { getLastMonthPeriod } from '../../lib/formatting'

export default function MonitoringPage() {
  const [{ accounts }] = useW3()
  const account = accounts[0]
  const accountDID = account?.did()

  const period = getLastMonthPeriod()

  const { data: planData, isLoading: planLoading } = usePlan(accountDID)
  const { data: usageData, isLoading: usageLoading } = useAccountUsage(accountDID)
  const { data: egressData, isLoading: egressLoading } = useAccountEgress(accountDID, period)

  const isLoading = planLoading || usageLoading || egressLoading

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hot-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Loading monitoring data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const reserved = planData?.limit ?? 0
  const used = usageData?.total ?? 0

  console.log('Monitoring data:', { planData, usageData, egressData })

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Monitoring Dashboard</h2>

        {/* Capacity Bar */}
        <div className="mb-8">
          <CapacityBar reserved={reserved} used={used} />
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Storage Chart Placeholder */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Storage</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-500">
                {usageData?.daily.length ?? 0} data points available
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Line chart: accumulated storage, Bars: daily deltas
            </p>
          </div>

          {/* Egress Chart Placeholder */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Egress</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-500">
                {Object.values(egressData?.spaces ?? {}).reduce(
                  (sum, space) => sum + space.dailyStats.length,
                  0
                )}{' '}
                data points available
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Bars: daily egress, Line: accumulated total
            </p>
          </div>
        </div>

        {/* Data Summary */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Storage:</span>
              <span className="ml-2 font-mono font-semibold">{usageData?.total ?? 0} bytes</span>
            </div>
            <div>
              <span className="text-gray-600">Total Egress:</span>
              <span className="ml-2 font-mono font-semibold">{egressData?.total ?? 0} bytes</span>
            </div>
            <div>
              <span className="text-gray-600">Reserved Capacity:</span>
              <span className="ml-2 font-mono font-semibold">{reserved === 0 ? 'Unlimited' : `${reserved} bytes`}</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
