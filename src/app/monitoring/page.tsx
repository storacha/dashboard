'use client'

import { useW3 } from '@storacha/ui-react'
import DashboardLayout from '../../components/DashboardLayout'
import CapacityBar from '../../components/CapacityBar'
import { useAccountUsage } from '../../hooks/useAccountUsage'
import { useAccountEgress } from '../../hooks/useAccountEgress'
import { usePlan } from '../../hooks/usePlan'
import { getLastMonthPeriod, formatBytes, formatBytesAuto } from '../../lib/formatting'

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
            <div className="w-12 h-12 border-4 border-hot-blue/20 border-t-hot-blue rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 text-sm">Loading monitoring data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const reserved = planData?.limit ?? 0
  const used = usageData?.total ?? 0
  const egressTotal = egressData?.total ?? 0
  const storageDataPoints = usageData?.daily.length ?? 0
  const egressDataPoints = Object.values(egressData?.spaces ?? {}).reduce(
    (sum, space) => sum + space.dailyStats.length,
    0
  )

  // Auto-format for display
  const usageDisplay = formatBytesAuto(used)
  const capacityDisplay = formatBytesAuto(reserved)
  const egressDisplay = formatBytesAuto(egressTotal)

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        {/* Page Title */}
        <h1 className="text-2xl font-bold text-hot-blue mb-8">Monitoring</h1>

        {/* Metrics Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Total Data Usage Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-hot-blue-light flex items-center justify-center">
                <svg className="w-5 h-5 text-hot-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm text-gray-500 font-medium">Total Data Usage</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {usageDisplay.value.toFixed(1)} <span className="text-base font-medium text-gray-400">{usageDisplay.unit}</span>
            </div>
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              +{storageDataPoints} data points
            </p>
          </div>

          {/* Capacity Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-hot-blue-light flex items-center justify-center">
                <svg className="w-5 h-5 text-hot-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <span className="text-sm text-gray-500 font-medium">Capacity</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {reserved === 0 ? '∞' : `${capacityDisplay.value.toFixed(1)}`} <span className="text-base font-medium text-gray-400">{reserved === 0 ? '' : capacityDisplay.unit}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Total Available</p>
          </div>

          {/* Usage Percentage Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-hot-yellow-light flex items-center justify-center">
                <svg className="w-5 h-5 text-hot-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <span className="text-sm text-gray-500 font-medium">Usage</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {reserved > 0 ? ((used / reserved) * 100).toFixed(2) : '—'}<span className="text-base font-medium text-gray-400">%</span>
            </div>
            {/* Mini progress bar */}
            <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-hot-blue rounded-full transition-all duration-500"
                style={{ width: `${reserved > 0 ? Math.min((used / reserved) * 100, 100) : 0}%` }}
              />
            </div>
          </div>

          {/* Egress Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <span className="text-sm text-gray-500 font-medium">Egress</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {egressDisplay.value.toFixed(2)} <span className="text-base font-medium text-gray-400">{egressDisplay.unit}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">This month</p>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="mb-8">
          <CapacityBar reserved={reserved} used={used} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Storage Chart Placeholder */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Daily Storage</h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-hot-blue"></span>
                  Storage
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-hot-yellow"></span>
                  Cumulative
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="h-56 flex items-center justify-center bg-gradient-to-b from-gray-50 to-white rounded-xl border border-dashed border-gray-200">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-hot-blue-light flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-hot-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-600">{storageDataPoints} data points</p>
                  <p className="text-xs text-gray-400 mt-1">Chart visualization coming soon</p>
                </div>
              </div>
            </div>
          </div>

          {/* Egress Chart Placeholder */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Daily Egress</h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-hot-blue"></span>
                  Egress
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-hot-yellow"></span>
                  Cumulative
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="h-56 flex items-center justify-center bg-gradient-to-b from-gray-50 to-white rounded-xl border border-dashed border-gray-200">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-hot-blue-light flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-hot-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-600">{egressDataPoints} data points</p>
                  <p className="text-xs text-gray-400 mt-1">Chart visualization coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </DashboardLayout>
  )
}