import type { AccountUsageGetSuccess, DailySnapshot, SpaceUsage, UsageData } from '../types'

/**
 * Roll up storage events into daily snapshots
 *
 * Takes the event-based data from account/usage/get and groups by day,
 * calculating the cumulative storage amount for each day.
 */
export function rollupStorageEventsByDay(
  usageData: AccountUsageGetSuccess
): DailySnapshot[] {
  // Map to store daily snapshots: date string -> bytes
  const dailyMap = new Map<string, number>()

  // Collect all events from all spaces and providers
  const allEvents: Array<{ date: Date; delta: number; initial: number }> = []

  for (const space of Object.values(usageData.spaces) as SpaceUsage[]) {
    for (const providerUsage of Object.values(space.providers) as UsageData[]) {
      // Start with initial size
      const initial = providerUsage.size.initial

      // Add each event
      for (const event of providerUsage.events) {
        const receiptDate = new Date(event.receiptAt)
        allEvents.push({
          date: receiptDate,
          delta: event.delta,
          initial,
        })
      }
    }
  }

  // Sort events by date
  allEvents.sort((a, b) => a.date.getTime() - b.date.getTime())

  if (allEvents.length === 0) {
    // No events, return empty array
    return []
  }

  // Calculate cumulative storage for each day
  let currentSize = 0

  // Start from the initial size (sum of all initials, but we should track this properly)
  // Actually, let's calculate the size at the beginning of the period
  const spaceTotals = new Map<string, number>()

  for (const space of Object.values(usageData.spaces) as SpaceUsage[]) {
    for (const [providerDID, providerUsage] of Object.entries(space.providers) as [string, UsageData][]) {
      const key = `${providerUsage.space}-${providerDID}`
      spaceTotals.set(key, providerUsage.size.initial)
    }
  }

  currentSize = Array.from(spaceTotals.values()).reduce((sum, val) => sum + val, 0)

  // Group events by date and apply deltas
  const dateToDeltas = new Map<string, number>()

  for (const event of allEvents) {
    const dateKey = event.date.toISOString().split('T')[0] // YYYY-MM-DD
    const existingDelta = dateToDeltas.get(dateKey) ?? 0
    dateToDeltas.set(dateKey, existingDelta + event.delta)
  }

  // Convert to daily snapshots
  const snapshots: DailySnapshot[] = []

  // Sort dates
  const sortedDates = Array.from(dateToDeltas.keys()).sort()

  for (const dateKey of sortedDates) {
    const delta = dateToDeltas.get(dateKey)!
    currentSize += delta

    snapshots.push({
      date: new Date(dateKey),
      bytes: Math.max(0, currentSize), // Ensure non-negative
    })
  }

  return snapshots
}

/**
 * Calculate daily deltas from snapshots
 */
export function calculateDailyDeltas(snapshots: DailySnapshot[]): DailySnapshot[] {
  if (snapshots.length === 0) return []

  const deltas: DailySnapshot[] = []

  for (let i = 0; i < snapshots.length; i++) {
    const current = snapshots[i]
    const previous = i > 0 ? snapshots[i - 1] : null

    const delta = previous ? current.bytes - previous.bytes : current.bytes

    deltas.push({
      date: current.date,
      bytes: delta,
    })
  }

  return deltas
}

/**
 * Fill in missing dates with zero values or carried-forward values
 */
export function fillMissingDates(
  snapshots: DailySnapshot[],
  from: Date,
  to: Date,
  fillZero: boolean = false
): DailySnapshot[] {
  if (snapshots.length === 0) {
    return []
  }

  const filled: DailySnapshot[] = []
  const snapshotMap = new Map(
    snapshots.map(s => [s.date.toISOString().split('T')[0], s.bytes])
  )

  const current = new Date(from)
  current.setHours(0, 0, 0, 0)

  const end = new Date(to)
  end.setHours(0, 0, 0, 0)

  let lastValue = 0

  while (current <= end) {
    const dateKey = current.toISOString().split('T')[0]
    const value = snapshotMap.get(dateKey)

    if (value !== undefined) {
      lastValue = value
      filled.push({ date: new Date(current), bytes: value })
    } else {
      filled.push({ date: new Date(current), bytes: fillZero ? 0 : lastValue })
    }

    current.setDate(current.getDate() + 1)
  }

  return filled
}
