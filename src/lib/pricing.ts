import { STORAGE_USD_PER_TIB, EGRESS_USD_PER_TIB } from './services'
import { bytesToTiB } from './formatting'

/**
 * Calculate storage price in USD
 */
export function calculateStoragePrice(bytes: number): number {
  const tib = bytesToTiB(bytes)
  return tib * STORAGE_USD_PER_TIB
}

/**
 * Calculate egress price in USD
 */
export function calculateEgressPrice(bytes: number): number {
  const tib = bytesToTiB(bytes)
  return tib * EGRESS_USD_PER_TIB
}

/**
 * Format price as USD
 */
export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`
}

/**
 * Calculate total invoice amount
 */
export function calculateTotalInvoice(storageBytes: number, egressBytes: number): {
  storageAmount: number
  egressAmount: number
  total: number
  storageTiB: number
  egressTiB: number
} {
  const storageTiB = bytesToTiB(storageBytes)
  const egressTiB = bytesToTiB(egressBytes)
  const storageAmount = storageTiB * STORAGE_USD_PER_TIB
  const egressAmount = egressTiB * EGRESS_USD_PER_TIB

  return {
    storageAmount,
    egressAmount,
    total: storageAmount + egressAmount,
    storageTiB,
    egressTiB,
  }
}
