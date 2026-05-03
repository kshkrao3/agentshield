import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "@/drizzle/schema";

export function getDb() {
  const { env } = getCloudflareContext();
  return drizzle(env.DB as D1Database, { schema });
}

export type DB = ReturnType<typeof getDb>;
