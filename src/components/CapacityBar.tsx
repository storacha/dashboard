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
  let barColor = 'bg-green-500'
  let textColor = 'text-green-700'

  if (percentUsed >= 90) {
    barColor = 'bg-red-500'
    textColor = 'text-red-700'
  } else if (percentUsed >= 70) {
    barColor = 'bg-yellow-500'
    textColor = 'text-yellow-700'
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Storage Capacity</h3>

      {/* Capacity Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Used: {formatBytes(used)}</span>
          <span>Reserved: {reserved === 0 ? 'Unlimited' : formatBytes(reserved)}</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
          <div
            className={`${barColor} h-full flex items-center justify-center text-white text-sm font-semibold transition-all duration-300`}
            style={{ width: `${Math.min(percentUsed, 100)}%` }}
          >
            {percentUsed >= 10 && `${percentUsed.toFixed(1)}%`}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase mb-1">Reserved</div>
          <div className="text-lg font-bold text-hot-blue">{reserved === 0 ? 'Unlimited' : formatBytes(reserved)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase mb-1">Used</div>
          <div className={`text-lg font-bold ${textColor}`}>{formatBytes(used)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase mb-1">Remaining</div>
          <div className="text-lg font-bold text-gray-700">{reserved === 0 ? 'Unlimited' : formatBytes(remaining)}</div>
        </div>
      </div>
    </div>
  )
}
