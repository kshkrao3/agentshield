import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/drizzle/schema";

export function getAuth() {
  const { env } = getCloudflareContext();
  const db = drizzle(env.DB as D1Database, { schema });

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    secret: (env as unknown as { BETTER_AUTH_SECRET: string }).BETTER_AUTH_SECRET,
    baseURL: (env as unknown as { BETTER_AUTH_URL: string }).BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    socialProviders: {
      github: {
        clientId: (env as unknown as { GITHUB_CLIENT_ID: string }).GITHUB_CLIENT_ID,
        clientSecret: (env as unknown as { GITHUB_CLIENT_SECRET: string }).GITHUB_CLIENT_SECRET,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    advanced: {
      cookiePrefix: "agentshield",
    },
  });
}

export type Auth = ReturnType<typeof getAuth>;
