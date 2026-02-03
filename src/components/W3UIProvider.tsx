'use client'

import { ReactNode } from 'react'
import { Provider, Authenticator } from '@storacha/ui-react'
import { uploadConnection } from '../lib/services'

// Service principal - the upload service DID
const servicePrincipal = {
  did: () => (process.env.NEXT_PUBLIC_UPLOAD_SERVICE_DID ?? 'did:web:up.storacha.network') as `did:${string}:${string}`,
}

// Receipts endpoint (optional, can be constructed from service URL)
const receiptsURL = new URL(
  '/receipt/',
  process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL ?? 'https://up.storacha.network'
)

/**
 * Provider wrapper for @storacha/ui-react
 *
 * Sets up the UCAN client with upload service connection and Authenticator context
 */
export default function W3UIProvider({ children }: { children: ReactNode }) {
  console.log('W3UIProvider: Using upload service at', servicePrincipal.did(), receiptsURL)
  return (
    <Provider
      connection={uploadConnection}
      servicePrincipal={servicePrincipal}
      receiptsEndpoint={receiptsURL}
    >
      <Authenticator as="div">
        {children}
      </Authenticator>
    </Provider>
  )
}
