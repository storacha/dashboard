import useSWR from 'swr'
import { useW3 } from '@storacha/ui-react'
import type { AccountUsageGetSuccess, DailySnapshot } from '../types'
import { rollupStorageEventsByDay } from '../lib/rollup'

interface UseAccountUsageResult {
  data?: {
    total: number
    daily: DailySnapshot[]
    raw: AccountUsageGetSuccess
  }
  error?: Error
  isLoading: boolean
}

/**
 * Hook to fetch account storage usage data
 *
 * Invokes account/usage/get on upload-service and rolls up events into daily snapshots
 */
export function useAccountUsage(accountDID?: string): UseAccountUsageResult {
  const [{ client }] = useW3()

  const { data, error, isLoading } = useSWR(
    client && accountDID ? `/usage/${accountDID}` : null,
    async () => {
      if (!client || !accountDID) return null

      // Invoke account/usage/get capability
      const usageData = await client.capability.account.usage.get(accountDID as `did:mailto:${string}`)

      // Roll up events into daily snapshots
      const dailySnapshots = rollupStorageEventsByDay(usageData)

      return {
        total: usageData.total,
        daily: dailySnapshots,
        raw: usageData,
      }
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 300000, // Refresh every 5 minutes
      dedupingInterval: 60000, // Dedupe requests within 1 minute
    }
  )

  return {
    data: data ?? undefined,
    error,
    isLoading,
  }
}
