// UCAN/DID types
export type DID = string
export type SpaceDID = `did:key:${string}`
export type ProviderDID = `did:web:${string}`

// Import Link type from multiformats
import type { Link } from 'multiformats'

// Storage usage types (from account/usage/get in @storacha/capabilities)
export interface UsageEvent {
  cause: Link  // CID Link
  delta: number  // Bytes added/removed
  receiptAt: string // ISO8601 timestamp
}

export interface UsageData {
  space: SpaceDID
  provider: ProviderDID
  period: {
    from: string // ISO8601
    to: string   // ISO8601
  }
  size: {
    initial: number  // Size at period start
    final: number    // Size at period end
  }
  events: UsageEvent[]
}

export interface SpaceUsage {
  total: number
  providers: Record<ProviderDID, UsageData>
}

export interface AccountUsageGetSuccess {
  total: number
  spaces: Record<SpaceDID, SpaceUsage>
  egress: {
    total: number
    spaces: Record<SpaceDID, any>
  }
}

// Egress types (from account/egress/get)
export interface DailyStat {
  date: Date
  egress: number
}

export interface SpaceEgress {
  total: number
  dailyStats: DailyStat[]
}

export interface AccountEgress {
  total: number
  spaces: Record<DID, SpaceEgress>
}

// Plan types (from plan/get)
export interface Plan {
  limit: number // Storage capacity in bytes
}

// Rolled-up daily data
export interface DailySnapshot {
  date: Date
  bytes: number
}

// Period filter
export interface Period {
  from: Date
  to: Date
}
