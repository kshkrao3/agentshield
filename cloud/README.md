# AgentShield Cloud

The hosted observability and managed-pattern layer for the [AgentShield](https://github.com/kshkrao3/agentshield) open-source SDK.

## Stack

- Next.js 15 (App Router) + React 19
- Tailwind CSS 3.4 + shadcn/ui conventions
- Drizzle ORM + Cloudflare D1 (SQLite at edge)
- Better Auth (email + GitHub OAuth)
- Stripe (subscriptions + portal)
- Cloudflare Workers (separate ingestion endpoint)
- Cloudflare R2 (raw event log archive)
- Deployed via OpenNext.js Cloudflare adapter

## Local development

```bash
# 1. Install deps
pnpm install

# 2. Copy env template
cp .dev.vars.example .dev.vars
# Fill in BETTER_AUTH_SECRET (run `openssl rand -hex 32`),
# GitHub OAuth client id/secret, Stripe test keys.

# 3. Create local D1 database (one-time)
pnpm wrangler d1 create agentshield-cloud
# Copy the printed database_id into wrangler.toml.

# 4. Generate + apply migrations
pnpm db:generate
pnpm db:migrate:local

# 5. Run dashboard
pnpm dev
# → http://localhost:3000

# 6. Run ingestion worker (separate terminal)
pnpm worker:dev
# → http://localhost:8787
```

## Deployment

```bash
# Apply migrations to remote D1
pnpm db:migrate:remote

# Deploy dashboard
pnpm cf:deploy

# Deploy ingestion worker (separate Worker)
pnpm worker:deploy

# Set secrets (one-time)
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```

## Architecture

```
┌────────────────┐                     ┌──────────────────────┐
│  Customer app  │                     │   AgentShield Cloud  │
│                │                     │   (Cloudflare)       │
│  ┌──────────┐  │     POST /v1/events │  ┌────────────────┐  │
│  │  Shield  │──┼────────────────────►│  │ ingest worker  │  │
│  │ + Reporter│  │   Bearer ask_...   │  └───────┬────────┘  │
│  └──────────┘  │                     │          │           │
└────────────────┘                     │          ▼           │
                                       │  ┌────────────────┐  │
                                       │  │   D1 (events)  │  │
                                       │  │   R2 (raw)     │  │
                                       │  │   KV (cache)   │  │
                                       │  └────────────────┘  │
                                       │          ▲           │
                                       │  ┌───────┴────────┐  │
                                       │  │   Dashboard    │  │
                                       │  │   (Next.js)    │  │
                                       │  └────────────────┘  │
                                       └──────────────────────┘
```

## Folder layout

```
cloud/
├── app/                # Next.js App Router pages + API routes
│   ├── api/            # Auth, orgs, projects, billing routes
│   ├── dashboard/      # Authenticated UI
│   ├── (auth)/         # Sign in / sign up
│   ├── onboarding/     # Org creation
│   ├── pricing/        # Public pricing page
│   ├── layout.tsx
│   └── page.tsx        # Marketing landing
├── components/         # Shared client components
├── drizzle/
│   ├── schema.ts       # Source of truth for DB schema
│   └── migrations/     # Generated SQL migrations
├── lib/                # Auth, db, plans, utils, stripe helpers
├── workers/
│   └── ingest/         # Standalone Worker for event ingestion
├── wrangler.toml       # Cloudflare bindings + env config
└── package.json
```

## Pricing tiers

| Tier | Price | Events/mo | Retention | Projects | Alerts | RBAC |
|------|-------|-----------|-----------|----------|--------|------|
| Free | $0 | 10K | 7 days | 1 | – | – |
| Pro | $29 | 1M | 90 days | 3 | ✓ | – |
| Team | $99 | 10M | 30 days | ∞ | ✓ | ✓ |
| Enterprise | custom | ∞ | 365 days | ∞ | ✓ | ✓ |

Defined in `lib/plans.ts` — change once, propagates everywhere.
