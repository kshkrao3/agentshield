/**
 * Cloudflare bindings injected at runtime via wrangler.toml.
 * Used by lib/db.ts, lib/auth.ts, lib/polar.ts via getCloudflareContext().
 */
declare global {
  interface CloudflareEnv {
    DB: D1Database;
    KV: KVNamespace;
    EVENT_LOGS: R2Bucket;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
    POLAR_ACCESS_TOKEN: string;
    POLAR_WEBHOOK_SECRET: string;
    POLAR_PRO_PRODUCT_ID: string;
    POLAR_TEAM_PRODUCT_ID: string;
    NEXT_PUBLIC_APP_URL: string;
  }
}

export {};
