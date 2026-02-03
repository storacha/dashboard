import { connect } from '@ucanto/client'
import { CAR, HTTP } from '@ucanto/transport'
import type { ConnectionView } from '@ucanto/interface'

// Parse DID from string
function parseDID(didString: string) {
  return { did: () => didString as `did:${string}:${string}` }
}

// Build-time environment variables (exposed to browser with NEXT_PUBLIC_ prefix)
const uploadServiceURL = new URL(
  process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL ?? 'https://up.forge.storacha.network'
)

const uploadServiceDID = parseDID(
  process.env.NEXT_PUBLIC_UPLOAD_SERVICE_DID ?? 'did:web:up.forge.storacha.network'
)

const etrackerServiceURL = new URL(
  process.env.NEXT_PUBLIC_ETRACKER_SERVICE_URL ?? 'https://etracker.forge.storacha.network'
)

const etrackerServiceDID = parseDID(
  process.env.NEXT_PUBLIC_ETRACKER_SERVICE_DID ?? 'did:web:etracker.forge.storacha.network'
)

// Pricing configuration (build-time, exposed to browser)
export const STORAGE_USD_PER_TIB = parseFloat(
  process.env.NEXT_PUBLIC_STORAGE_USD_PER_TIB ?? '5.99'
)

export const EGRESS_USD_PER_TIB = parseFloat(
  process.env.NEXT_PUBLIC_EGRESS_USD_PER_TIB ?? '10.0'
)

// Create service connections
export const uploadConnection: ConnectionView<any> = connect({
  id: uploadServiceDID,
  codec: CAR.outbound,
  channel: HTTP.open({ url: uploadServiceURL, method: 'POST' }),
})

export const etrackerConnection: ConnectionView<any> = connect({
  id: etrackerServiceDID,
  codec: CAR.outbound,
  channel: HTTP.open({ url: etrackerServiceURL, method: 'POST' }),
})

// Export service URLs for display purposes
export const UPLOAD_SERVICE_URL = uploadServiceURL.toString()
export const ETRACKER_SERVICE_URL = etrackerServiceURL.toString()
