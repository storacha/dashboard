import useSWR from 'swr'
import { useW3 } from '@storacha/ui-react'
import type { AccountEgress, Period } from '../types'
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

      // Create account/egress/get invocation
      const capability = period
        ? {
            can: 'account/egress/get' as const,
            with: accountDID as `${string}:${string}`,
            nb: {
              period: {
                from: period.from.toISOString(),
                to: period.to.toISOString(),
              },
            },
          }
        : {
            can: 'account/egress/get' as const,
            with: accountDID as `${string}:${string}`,
          }

      const invocation = await invoke({
        issuer: client.agent.issuer,
        audience: etrackerConnection.id,
        capability: capability as any, // Type assertion needed for custom capability
        proofs: client.proofs(),
      })

      const result = await invocation.execute(etrackerConnection)

      // Log the full result structure to understand what we're getting
      console.log('account/egress/get result:', {
        hasOut: !!result.out,
        hasOk: !!result.out?.ok,
        hasError: !!result.out?.error,
        fullResult: result,
      })

      // Check for errors in the receipt (UCAN errors are returned in the receipt, not as exceptions)
      if (result.out.error) {
        const errorMessage = result.out.error.message ?? 'Failed to fetch egress data'
        const errorName = result.out.error.name ?? 'UnknownError'
        console.error('account/egress/get error detected:', {
          name: errorName,
          message: errorMessage,
          fullError: result.out.error,
          accountDID,
          period,
        })
        const error = new Error(`${errorName}: ${errorMessage}`)
        // @ts-ignore - Add the full UCAN error for debugging
        error.ucanto = result.out.error
        throw error
      }

      console.log('account/egress/get success:', { ok: result.out.ok })
      return result.out.ok as AccountEgress
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 0, // Don't auto-refresh - user can manually refresh
      dedupingInterval: 30000, // Dedupe requests within 30 seconds
      shouldRetryOnError: false, // Don't retry on errors
      onErrorRetry: () => {
        // Completely disable retries
        return
      },
    }
  )

  return {
    data: data ?? undefined,
    error,
    isLoading,
  }
}
