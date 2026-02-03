import useSWR from 'swr'
import { useW3 } from '@storacha/ui-react'
import type { AccountEgress, Period } from '../types'
import { invokeWithExpiryCheck } from '../components/Authenticator'
import { etrackerConnection } from '../lib/services'
import { invoke } from '@ucanto/client'

interface UseAccountEgressResult {
  data?: AccountEgress
  error?: Error
  isLoading: boolean
}

/**
 * Hook to fetch account egress data
 *
 * Invokes account/egress/get on etracker-service to get daily egress stats
 */
export function useAccountEgress(
  accountDID?: string,
  period?: Period
): UseAccountEgressResult {
  const [{ client }] = useW3()

  const cacheKey = period
    ? `/egress/${accountDID}/${period.from.toISOString()}/${period.to.toISOString()}`
    : `/egress/${accountDID}`

  const { data, error, isLoading } = useSWR(
    client && accountDID ? cacheKey : null,
    async () => {
      if (!client || !accountDID) return null

      return await invokeWithExpiryCheck(async () => {
        // Create account/egress/get invocation
        // Note: This is a simplified version - actual implementation depends on
        // how account/egress/get capability is defined in go-libstoracha

        // For now, we'll assume the capability exists and can be invoked
        // The actual implementation may need to be adjusted based on the
        // capability definition

        const capability = {
          can: 'account/egress/get' as const,
          with: accountDID as `${string}:${string}`,
          nb: period
            ? {
                period: {
                  from: period.from.toISOString(),
                  to: period.to.toISOString(),
                },
              }
            : undefined,
        } as const

        const invocation = await invoke({
          issuer: client.agent.issuer,
          audience: etrackerConnection.id,
          capability: capability as any, // Type assertion needed for custom capability
          proofs: client.proofs(),
        })

        const result = await invocation.execute(etrackerConnection)

        if (result.out.error) {
          throw new Error(result.out.error.message ?? 'Failed to fetch egress data')
        }

        return result.out.ok as AccountEgress
      })
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 60000, // Refresh every minute for monitoring
      dedupingInterval: 30000, // Dedupe requests within 30 seconds
    }
  )

  return {
    data: data ?? undefined,
    error,
    isLoading,
  }
}
