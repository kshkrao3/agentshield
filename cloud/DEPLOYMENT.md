# Deployment guide

End-to-end checklist for taking AgentShield Cloud from local repo to production on Cloudflare.

## 0. Prerequisites

- Cloudflare account (free tier is fine)
- GitHub account (for OAuth app)
- Stripe account (test mode is fine to start)
- `wrangler` CLI logged in: `wrangler login`

## 1. Create Cloudflare resources

```bash
cd cloud

# D1 database
wrangler d1 create agentshield-cloud
# → Note the database_id, paste into wrangler.toml

# KV namespace (for API key cache + usage counters)
wrangler kv:namespace create "agentshield-kv"
# → Note the id, paste into wrangler.toml

# R2 bucket (raw event log archive)
wrangler r2 bucket create agentshield-event-logs
```

Edit `wrangler.toml`, replacing the three `REPLACE_WITH_YOUR_*` placeholders.

## 2. GitHub OAuth app

1. Go to https://github.com/settings/applications/new
2. Application name: `AgentShield Cloud`
3. Homepage: `https://cloud.agentshield.dev` (or your domain)
4. Authorization callback URL: `https://cloud.agentshield.dev/api/auth/callback/github`
5. Save the Client ID + Client Secret

For local dev, create a second app with `http://localhost:3000/api/auth/callback/github`.

## 3. Stripe products

1. Create two recurring prices in Stripe (Test mode):
   - `agentshield-pro` — $29/month
   - `agentshield-team` — $99/month
2. Copy the price IDs (`price_...`)
3. Set up the webhook endpoint:
   - URL: `https://cloud.agentshield.dev/api/billing/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the webhook signing secret (`whsec_...`)

## 4. Set secrets

```bash
# Generate Better Auth secret
openssl rand -hex 32  # → BETTER_AUTH_SECRET

# Set production secrets (one-time)
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put BETTER_AUTH_URL  # e.g. https://cloud.agentshield.dev
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put STRIPE_PRO_PRICE_ID
wrangler secret put STRIPE_TEAM_PRICE_ID

# Repeat for the ingestion Worker (env=ingest)
wrangler secret put STRIPE_SECRET_KEY --env ingest
# (only set what the ingest worker actually needs — currently none of the above)
```

## 5. Apply migrations

```bash
pnpm db:generate          # generates SQL from drizzle/schema.ts
pnpm db:migrate:remote    # applies to production D1
```

## 6. Deploy

```bash
pnpm cf:deploy            # dashboard
pnpm worker:deploy        # ingestion worker (separate URL)
```

## 7. Custom domain

In the Cloudflare dashboard:
- `cloud.agentshield.dev` → dashboard Worker
- `ingest.agentshield.dev` → ingest Worker

Update `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to use the custom domain.
Update the GitHub OAuth callback URL to match.

## 8. Smoke test

```bash
# Sign up a test user
open https://cloud.agentshield.dev/sign-up

# Create an org + project, generate an API key, then:
curl -X POST https://ingest.agentshield.dev/v1/events \
  -H "Authorization: Bearer ask_..." \
  -H "Content-Type: application/json" \
  -d '{
    "sdk_language": "python",
    "sdk_version": "0.2.0",
    "events": [{
      "type": "injection",
      "severity": "high",
      "message": "test event",
      "session_id": "test-session"
    }]
  }'
# → {"ok":true,"accepted":1}
```

The event should appear in the dashboard within seconds.
