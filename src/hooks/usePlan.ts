import useSWR from 'swr'
import { useW3 } from '@storacha/ui-react'
import { invokeWithExpiryCheck } from '../components/Authenticator'

interface UsePlanResult {
  data?: {
    limit: number // Reserved capacity in bytes
  }
  error?: Error
  isLoading: boolean
}

/**
 * Hook to fetch account plan data
 *
 * Invokes plan/get on upload-service to get reserved storage capacity
 */
export function usePlan(accountDID?: string): UsePlanResult {
  const [{ client, accounts }] = useW3()

  // Get the account object
  const account = accounts.find((acc) => acc.did() === accountDID)

  const { data, error, isLoading } = useSWR(
    client && account ? `/plan/${accountDID}` : null,
    async () => {
      if (!client || !account) return null

      return await invokeWithExpiryCheck(async () => {
        // Invoke plan/get capability
        const result = await account.plan.get()

        if (result.error) {
          throw new Error(result.error.message ?? 'Failed to fetch plan')
        }

        // The type definition may not include 'limit' but it exists in the actual response
        const plan = result.ok as any
        return {
          limit: Number(plan?.limit) || 0,
        }
      })
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 600000, // Refresh every 10 minutes
      dedupingInterval: 120000, // Dedupe requests within 2 minutes
    }
  )

  return {
    data: data ?? undefined,
    error,
    isLoading,
  }
}
