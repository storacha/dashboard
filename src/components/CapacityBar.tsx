'use client'

import { formatBytes } from '../lib/formatting'

interface CapacityBarProps {
  reserved: number // bytes
  used: number // bytes
}

export default function CapacityBar({ reserved, used }: CapacityBarProps) {
  const remaining = Math.max(0, reserved - used)
  const percentUsed = reserved > 0 ? (used / reserved) * 100 : 0

  // Color based on usage percentage
  let barColor = 'bg-hot-blue'
  let statusColor = 'text-hot-blue'
  let statusBg = 'bg-hot-blue-light'
  let statusLabel = 'Healthy'

  if (percentUsed >= 90) {
    barColor = 'bg-red-500'
    statusColor = 'text-red-600'
    statusBg = 'bg-red-50'
    statusLabel = 'Critical'
  } else if (percentUsed >= 70) {
    barColor = 'bg-hot-yellow'
    statusColor = 'text-yellow-700'
    statusBg = 'bg-hot-yellow-light'
    statusLabel = 'Warning'
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-gray-900">Storage Capacity</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBg} ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* Capacity Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">
            Used: <span className="font-medium text-gray-700">{formatBytes(used)}</span>
          </span>
          <span className="text-gray-500">
            {reserved === 0 ? 'Unlimited' : formatBytes(reserved)}
          </span>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
          <div
            className={`${barColor} h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2`}
            style={{ width: `${Math.max(Math.min(percentUsed, 100), 0)}%` }}
          >
            {percentUsed >= 15 && (
              <span className="text-white text-xs font-medium">
                {percentUsed.toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {percentUsed < 15 && percentUsed > 0 && (
          <p className="text-xs text-gray-500 mt-1">{percentUsed.toFixed(1)}% used</p>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Reserved</p>
          <p className="text-lg font-bold text-hot-blue">
            {reserved === 0 ? '∞' : formatBytes(reserved)}
          </p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Used</p>
          <p className={`text-lg font-bold ${statusColor}`}>
            {formatBytes(used)}
          </p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Remaining</p>
          <p className="text-lg font-bold text-gray-700">
            {reserved === 0 ? '∞' : formatBytes(remaining)}
          </p>
        </div>
      </div>

      {/* Quick action */}
      {reserved > 0 && (
        <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {percentUsed >= 70
              ? 'Consider upgrading your storage capacity'
              : 'Your storage is within healthy limits'}
          </p>
          <button className="px-4 py-2 bg-hot-blue text-white text-sm font-medium rounded-xl hover:bg-hot-blue-dark transition-colors">
            Upgrade
          </button>
        </div>
      )}
    </div>
  )
}