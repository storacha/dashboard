# Customer Dashboard

A client-side web application for Storacha customers to view their storage usage, egress statistics, and monthly invoicing.

## Architecture

- **Framework**: Next.js 15+ with App Router and static export
- **Authentication**: Email-based UCAN via @storacha/ui-react
- **Styling**: Tailwind CSS with Storacha design tokens
- **Data Fetching**: SWR with stale-while-revalidate caching
- **Deployment**: TBD

## Features

### Invoicing View

- Monthly storage usage in TiB with pricing calculations
- Monthly egress usage in TiB with pricing calculations
- Configurable pricing (set at build time)
- Current calendar month billing period

### Monitoring View

- **Capacity Bar**: Visual representation of reserved vs. used storage
- **Daily Storage Chart**: Line chart for accumulated storage, bars for daily deltas
- **Daily Egress Chart**: Bars for daily egress, line for accumulated total
- Default period: First day of last complete month to today

## Data Sources

| Data              | Capability           | Service          | Notes                                 |
| ----------------- | -------------------- | ---------------- | ------------------------------------- |
| Reserved Capacity | `plan/get`           | upload-service   | Plan limit in bytes                   |
| Storage Usage     | `account/usage/get`  | upload-service   | Events rolled up into daily snapshots |
| Egress Data       | `account/egress/get` | etracker-service | Daily stats already aggregated        |

## Development

### Prerequisites

- Node.js 20+
- pnpm

### Local Development

```bash
# Install dependencies
pnpm install

# Run development server (env vars can also be set in .env.local)
NEXT_PUBLIC_UPLOAD_SERVICE_URL=https://staging.up.warm.storacha.network \
NEXT_PUBLIC_UPLOAD_SERVICE_DID=did:web:staging.up.warm.storacha.network \
NEXT_PUBLIC_ETRACKER_SERVICE_URL=https://staging.etracker.warm.storacha.network \
NEXT_PUBLIC_ETRACKER_SERVICE_DID=did:web:staging.etracker.warm.storacha.network \
NEXT_PUBLIC_STORAGE_USD_PER_TIB=5.99 \
NEXT_PUBLIC_EGRESS_USD_PER_TIB=10.0 \
pnpm dev
```

The dashboard will be available at http://localhost:3001

### Build

```bash
pnpm build
```

The static output will be in `out/` directory.

## Environment Variables

All configuration is set at build time:

- `NEXT_PUBLIC_ETRACKER_SERVICE_DID` - Etracker service DID
- `NEXT_PUBLIC_ETRACKER_SERVICE_URL` - Etracker service endpoint
- `NEXT_PUBLIC_UPLOAD_SERVICE_DID` - Upload service DID
- `NEXT_PUBLIC_UPLOAD_SERVICE_URL` - Upload service endpoint
- `NEXT_PUBLIC_STORAGE_USD_PER_TIB` - Storage price in USD per TiB/month
- `NEXT_PUBLIC_EGRESS_USD_PER_TIB` - Egress price in USD per TiB

## Authentication Flow

1. User enters email address
2. Verification email sent via @storacha/client
3. User clicks link to authorize
4. Delegations stored in browser IndexedDB
5. Dashboard invokes capabilities using stored delegations

### Expired Delegation Handling

The dashboard detects expired UCAN delegations and automatically:

- Shows error toast notification
- Clears stored delegations from IndexedDB
- Reloads page to show login form

## Project Structure

```
web/customer/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── layout.tsx    # Root layout with providers
│   │   ├── page.tsx      # Invoicing view
│   │   └── monitoring/   # Monitoring view
│   ├── components/       # React components
│   │   ├── Authenticator.tsx
│   │   ├── W3UIProvider.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── CapacityBar.tsx
│   │   └── ...
│   ├── hooks/           # Data fetching hooks
│   │   ├── usePlan.ts
│   │   ├── useAccountUsage.ts
│   │   └── useAccountEgress.ts
│   ├── lib/             # Utilities
│   │   ├── services.ts      # UCAN connections
│   │   ├── formatting.ts    # Byte/date formatting
│   │   ├── pricing.ts       # Price calculations
│   │   └── rollup.ts        # Event aggregation
│   └── types/           # TypeScript types
├── public/              # Static assets
├── package.json
├── next.config.js       # Static export config
├── tailwind.config.ts   # Storacha design tokens
└── tsconfig.json
```

## Known Limitations

1. **Chart Placeholders**: Full recharts implementation needs to be completed
2. **Error Handling**: More robust error recovery needed for network failures
3. **Loading States**: Could be enhanced with skeleton screens

## Future Enhancements

- [ ] Implement full recharts visualizations
- [ ] Add date range picker for custom periods
- [ ] Export invoice data as PDF
- [ ] Add space-level filtering
- [ ] Real-time updates via WebSocket
- [ ] Mobile-responsive improvements
