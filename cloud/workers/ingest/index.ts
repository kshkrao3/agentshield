/**
 * AgentShield ingestion worker.
 *
 * Receives violation events from SDK Reporters, authenticates via API key,
 * enforces per-org quotas, persists to D1, and tees raw payloads to R2.
 */
import { drizzle } from "drizzle-orm/d1";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../drizzle/schema";

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  EVENT_LOGS: R2Bucket;
}

const eventSchema = z.object({
  type: z.enum(["injection", "tool", "memory"]),
  severity: z.enum(["low", "medium", "high"]),
  pattern: z.string().max(500).optional(),
  message: z.string().max(2000).optional(),
  session_id: z.string().max(128).optional(),
  source: z.string().max(256).optional(),
  metadata: z.record(z.unknown()).optional(),
  occurred_at: z.string().datetime().optional(),
});

const batchSchema = z.object({
  sdk_language: z.enum(["python", "typescript"]),
  sdk_version: z.string().max(32),
  events: z.array(eventSchema).min(1).max(500),
});

const PLAN_MONTHLY_EVENTS: Record<string, number> = {
  free: 10_000,
  pro: 1_000_000,
  team: 10_000_000,
  enterprise: Number.MAX_SAFE_INTEGER,
};

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function generateId(prefix: string): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${id}`;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthUtc(): string {
  return new Date().toISOString().slice(0, 7);
}

function corsHeaders(): HeadersInit {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-max-age": "86400",
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders() },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return jsonResponse({ ok: true });
    }
    if (url.pathname !== "/v1/events") {
      return jsonResponse({ error: "not_found" }, 404);
    }
    if (request.method !== "POST") {
      return jsonResponse({ error: "method_not_allowed" }, 405);
    }

    // Auth via Authorization: Bearer <key>
    const authHeader = request.headers.get("authorization") ?? "";
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) return jsonResponse({ error: "missing_api_key" }, 401);

    const apiKey = match[1].trim();
    if (!apiKey.startsWith("ask_")) return jsonResponse({ error: "invalid_api_key_format" }, 401);

    const keyHash = await sha256(apiKey);
    const db = drizzle(env.DB, { schema });

    // Resolve key → project → org. Cache resolution in KV for 60s.
    const cacheKey = `key:${keyHash}`;
    let resolution = await env.KV.get<{ projectId: string; orgId: string; plan: string }>(cacheKey, "json");

    if (!resolution) {
      const rows = await db
        .select({
          projectId: schema.apiKey.projectId,
          orgId: schema.project.orgId,
          plan: schema.organization.plan,
          revokedAt: schema.apiKey.revokedAt,
        })
        .from(schema.apiKey)
        .innerJoin(schema.project, eq(schema.project.id, schema.apiKey.projectId))
        .innerJoin(schema.organization, eq(schema.organization.id, schema.project.orgId))
        .where(and(eq(schema.apiKey.keyHash, keyHash), isNull(schema.apiKey.revokedAt)))
        .limit(1);

      if (rows.length === 0) return jsonResponse({ error: "invalid_api_key" }, 401);
      resolution = { projectId: rows[0].projectId, orgId: rows[0].orgId, plan: rows[0].plan };
      await env.KV.put(cacheKey, JSON.stringify(resolution), { expirationTtl: 60 });
    }

    // Parse + validate body.
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "invalid_json" }, 400);
    }

    const parsed = batchSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: "invalid_payload", details: parsed.error.flatten() }, 400);
    }

    // Quota check (rolling 30-day approximation via month-bucketed KV counter).
    const limit = PLAN_MONTHLY_EVENTS[resolution.plan] ?? PLAN_MONTHLY_EVENTS.free;
    const usageKey = `usage:${resolution.orgId}:${monthUtc()}`;
    const usedRaw = (await env.KV.get(usageKey)) ?? "0";
    const used = parseInt(usedRaw, 10);
    const incoming = parsed.data.events.length;

    if (used + incoming > limit) {
      return jsonResponse(
        { error: "quota_exceeded", limit, used, plan: resolution.plan },
        429,
      );
    }

    // Insert events.
    const now = Math.floor(Date.now() / 1000);
    const rows = parsed.data.events.map((e) => ({
      id: generateId("evt"),
      projectId: resolution!.projectId,
      type: e.type,
      severity: e.severity,
      pattern: e.pattern ?? null,
      message: e.message ?? null,
      sessionId: e.session_id ?? null,
      source: e.source ?? null,
      metadata: e.metadata ?? null,
      sdkLanguage: parsed.data.sdk_language,
      sdkVersion: parsed.data.sdk_version,
      occurredAt: e.occurred_at ? Math.floor(new Date(e.occurred_at).getTime() / 1000) : now,
      receivedAt: now,
    }));

    // D1 limits each statement to ~100 bound params; chunk inserts.
    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      await db.insert(schema.event).values(chunk.map((r) => ({
        ...r,
        occurredAt: new Date(r.occurredAt * 1000),
        receivedAt: new Date(r.receivedAt * 1000),
      })));
    }

    // Update daily usage row + KV counter.
    ctx.waitUntil((async () => {
      const day = todayUtc();
      await db
        .insert(schema.usageDaily)
        .values({ orgId: resolution!.orgId, day, eventCount: incoming })
        .onConflictDoUpdate({
          target: [schema.usageDaily.orgId, schema.usageDaily.day],
          set: {
            eventCount: sql`${schema.usageDaily.eventCount} + ${incoming}`,
            updatedAt: new Date(),
          },
        });
      await env.KV.put(usageKey, String(used + incoming), { expirationTtl: 60 * 60 * 24 * 35 });

      // Tee raw batch to R2 for compliance / replay.
      const r2Key = `${resolution!.orgId}/${day}/${generateId("batch")}.json`;
      await env.EVENT_LOGS.put(r2Key, JSON.stringify(parsed.data), {
        httpMetadata: { contentType: "application/json" },
      });

      // Update last_used_at on the API key.
      await db
        .update(schema.apiKey)
        .set({ lastUsedAt: new Date() })
        .where(eq(schema.apiKey.keyHash, keyHash));
    })());

    return jsonResponse({ ok: true, accepted: incoming }, 202);
  },
};
