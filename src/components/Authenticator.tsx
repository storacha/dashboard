'use client'

import { useEffect, type JSX, type ReactNode } from 'react'
import {
  Authenticator as AuthCore,
  useAuthenticator,
} from '@storacha/ui-react'
import toast from 'react-hot-toast'

/**
 * Authentication form component
 */
export function AuthenticationForm(): JSX.Element {
  const [{ submitted }] = useAuthenticator()

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="authenticator max-w-md w-full">
        <AuthCore.Form className="text-hot-blue bg-white border border-hot-blue rounded-2xl shadow-md px-10 pt-8 pb-8">
          <div className="flex flex-row gap-4 mb-8 justify-center">
            <h1 className="text-3xl font-bold text-hot-blue font-sans">
              Storacha Customer Dashboard
            </h1>
          </div>
          <div>
            <label
              className="block mb-2 uppercase text-xs font-sans font-semibold m-1"
              htmlFor="authenticator-email"
            >
              Email
            </label>
            <AuthCore.EmailInput
              className="text-black py-2 px-4 rounded-xl block mb-4 border border-hot-blue w-full focus:outline-none focus:ring-2 focus:ring-hot-blue"
              id="authenticator-email"
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="text-center mt-4">
            <button
              className="inline-block bg-hot-blue border border-hot-blue hover:bg-hot-blue-dark font-sans text-white uppercase text-sm px-8 py-3 rounded-full whitespace-nowrap transition-colors"
              type="submit"
              disabled={submitted}
            >
              {submitted ? 'Authorizing...' : 'Authorize'}
            </button>
          </div>
        </AuthCore.Form>
        <p className="text-xs text-gray-600 italic max-w-xs text-center mt-6 mx-auto">
          By logging in, you agree to the{' '}
          <a
            className="underline hover:text-hot-blue"
            href="https://docs.storacha.network/terms/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of Service
          </a>
          .
        </p>
      </div>
    </div>
  )
}

/**
 * Email verification pending screen
 */
export function AuthenticationSubmitted(): JSX.Element {
  const [{ email }] = useAuthenticator()

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="authenticator max-w-md w-full">
        <div className="text-hot-blue bg-white border border-hot-blue rounded-2xl shadow-md px-10 pt-8 pb-8">
          <div className="flex flex-row gap-4 mb-8 justify-center">
            <h1 className="text-3xl font-bold text-hot-blue font-sans">
              Check Your Email
            </h1>
          </div>
          <h2 className="text-xl font-sans mb-4">Verify your email address</h2>
          <p className="pt-2 pb-4 text-gray-700">
            Click the link in the email we sent to{' '}
            <span className="font-semibold tracking-wide font-mono text-hot-blue">
              {email}
            </span>{' '}
            to authorize this agent.
            <br />
            <br />
            Don&apos;t forget to check your spam folder!
          </p>
          <AuthCore.CancelButton className="inline-block bg-hot-blue border border-hot-blue hover:bg-hot-blue-dark font-sans text-white uppercase text-sm px-8 py-3 rounded-full whitespace-nowrap transition-colors">
            Cancel
          </AuthCore.CancelButton>
        </div>
      </div>
    </div>
  )
}

/**
 * Wrapper to ensure user is authenticated before showing children
 */
export function AuthenticationEnsurer({
  children,
}: {
  children: ReactNode
}): JSX.Element {
  const [{ accounts }] = useAuthenticator()

  // Check if user is authenticated
  const isAuthenticated = accounts.length > 0

  if (!isAuthenticated) {
    return <AuthenticationForm />
  }

  return <>{children}</>
}

/**
 * Main Authenticator component that handles the full auth flow
 */
export default function Authenticator({
  children,
}: {
  children: ReactNode
}): JSX.Element {
  const [{ submitted, accounts }] = useAuthenticator()

  // Show email verification screen if submitted but not yet authenticated
  if (submitted && accounts.length === 0) {
    return <AuthenticationSubmitted />
  }

  // Show auth form or children
  return <AuthenticationEnsurer>{children}</AuthenticationEnsurer>
}

/**
 * Check if an error indicates an expired delegation
 */
export function isExpiredDelegationError(error: any): boolean {
  if (!error) return false

  const message = error?.message?.toLowerCase() ?? ''
  const name = error?.name?.toLowerCase() ?? ''

  return (
    message.includes('expired') ||
    message.includes('not valid') ||
    message.includes('invalid') ||
    name === 'expirederror' ||
    name === 'unauthorizederror'
  )
}

/**
 * Clear stored delegations from IndexedDB
 * Note: This is a simplified version. The actual implementation
 * depends on the internal structure of @storacha/ui-react
 */
export async function clearStoredDelegations(): Promise<void> {
  try {
    // Clear IndexedDB stores used by @storacha/access
    const databases = await indexedDB.databases()
    for (const db of databases) {
      if (db.name?.includes('@w3ui') || db.name?.includes('storacha')) {
        indexedDB.deleteDatabase(db.name)
      }
    }
  } catch (error) {
    console.error('Failed to clear delegations:', error)
  }
}

/**
 * Wrapper for capability invocations that detects expired delegations
 */
export async function invokeWithExpiryCheck<T>(
  invokeFn: () => Promise<T>
): Promise<T> {
  try {
    return await invokeFn()
  } catch (error) {
    // Check if error indicates expired delegation
    if (isExpiredDelegationError(error)) {
      toast.error('Your session has expired. Please log in again.')

      // Clear auth state
      await clearStoredDelegations()

      // Force re-auth by reloading
      setTimeout(() => {
        window.location.reload()
      }, 1500)

      throw new Error('Session expired')
    }
    throw error
  }
}
