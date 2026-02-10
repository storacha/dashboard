import { format } from 'date-fns'

/**
 * Convert bytes to TiB
 */
export function bytesToTiB(bytes: number): number {
  return bytes / (1024 ** 4)
}

/**
 * Convert bytes to GiB
 */
export function bytesToGiB(bytes: number): number {
  return bytes / (1024 ** 3)
}

/**
 * Format bytes in a human-readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Format bytes to the most appropriate unit, returning value and unit separately.
 * Uses 1.0 as the threshold — displayed value is always >= 1.0.
 */
export function formatBytesAuto(bytes: number, decimals = 2): { value: number; unit: string; formatted: string } {
  if (bytes === 0) return { value: 0, unit: 'GiB', formatted: '0.00 GiB' }

  const k = 1024
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)

  return {
    value,
    unit: sizes[i],
    formatted: `${value.toFixed(decimals)} ${sizes[i]}`,
  }
}

/**
 * Format date in a standard format
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMM d, yyyy')
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMM d, yyyy HH:mm')
}

/**
 * Get start of current month
 */
export function getCurrentMonthStart(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

/**
 * Get end of current month (now)
 */
export function getCurrentMonthEnd(): Date {
  return new Date()
}

/**
 * Get period for current calendar month
 */
export function getCurrentMonthPeriod() {
  return {
    from: getCurrentMonthStart(),
    to: getCurrentMonthEnd(),
  }
}

/**
 * Get period for last calendar month
 */
export function getLastMonthPeriod() {
  return {
    from: getFirstDayOfLastMonth(),
    to: getCurrentMonthStart(),
  }
}

/**
 * Get the first day of the last complete month
 */
export function getFirstDayOfLastMonth(): Date {
  const now = new Date()
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return new Date(firstOfThisMonth.getFullYear(), firstOfThisMonth.getMonth() - 1, 1)
}

/**
 * Get default period (first day of last month to today)
 * This matches the default period for account/usage/get and account/egress/get
 */
export function getDefaultPeriod() {
  return {
    from: getFirstDayOfLastMonth(),
    to: new Date(),
  }
}