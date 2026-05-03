import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, requireActiveOrg } from "@/lib/session";
import { getDb } from "@/lib/db";
import { project, apiKey, event } from "@/drizzle/schema";
import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { ApiKeyManager } from "./api-key-manager";
import { formatRelativeTime, formatDate } from "@/lib/utils";
import { Zap, Key, Clock } from "lucide-react";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);
  const { id } = await params;
  const db = getDb();

  const projectRow = await db
    .select()
    .from(project)
    .where(and(eq(project.id, id), eq(project.orgId, org.id)))
    .limit(1);
  if (projectRow.length === 0) notFound();
  const p = projectRow[0];

  const keys = await db
    .select()
    .from(apiKey)
    .where(and(eq(apiKey.projectId, id), isNull(apiKey.revokedAt)))
    .orderBy(desc(apiKey.createdAt));

  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentEvents = await db
    .select()
    .from(event)
    .where(and(eq(event.projectId, id), gte(event.occurredAt, since7d)))
    .orderBy(desc(event.occurredAt))
    .limit(10);

  const [{ count24h }] = await db
    .select({ count24h: sql<number>`count(*)` })
    .from(event)
    .where(and(
      eq(event.projectId, id),
      gte(event.occurredAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    ));

  const envColor = p.environment === "prod" ? "bg-green-500" : p.environment === "staging" ? "bg-amber-400" : "bg-slate-400";
  const envBadge = p.environment === "prod"
    ? "bg-green-50 text-green-700 border border-green-200"
    : p.environment === "staging"
    ? "bg-amber-50 text-amber-700 border border-amber-200"
    : "bg-slate-100 text-slate-600 border border-slate-200";

  return (
    <div className="px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
          ← Projects
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-8 rounded-full ${envColor}`} />
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{p.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-400 font-mono">{p.slug}</span>
                <span className={`text-[10px] uppercase font-semibold tracking-wide rounded-full px-2 py-0.5 ${envBadge}`}>
                  {p.environment}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4 text-right">
            <p className="text-3xl font-bold text-slate-900">{count24h.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-0.5">events / 24h</p>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Key size={15} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">API Keys</h2>
        </div>
        <div className="p-6">
          <ApiKeyManager projectId={id} keys={keys.map((k) => ({
            id: k.id,
            name: k.name,
            prefix: k.keyPrefix,
            createdAt: k.createdAt.toISOString(),
            lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
          }))} />
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={15} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Recent events</h2>
            <span className="text-xs text-slate-400">(last 7 days)</span>
          </div>
          <Link
            href={`/dashboard/events?project=${id}`}
            className="text-xs text-green-700 hover:text-green-800 font-medium transition-colors"
          >
            View all →
          </Link>
        </div>
        {recentEvents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <Zap size={22} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-500">No events yet.</p>
            <p className="text-xs text-slate-400 mt-1">Once your SDK reports a violation it&apos;ll appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentEvents.map((e, idx) => (
              <Link
                key={e.id}
                href={`/dashboard/events/${e.id}`}
                className={`flex items-center gap-4 px-6 py-3 hover:bg-slate-50/80 transition-colors ${idx % 2 !== 0 ? "bg-slate-50/30" : ""}`}
              >
                <SeverityBadge severity={e.severity} />
                <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{e.type}</span>
                <span className="flex-1 truncate text-sm text-slate-700">{e.message ?? e.pattern ?? "(no message)"}</span>
                <span className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1">
                  <Clock size={11} />
                  {formatRelativeTime(e.occurredAt)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    high: "bg-red-50 text-red-700 border border-red-200",
    medium: "bg-amber-50 text-amber-700 border border-amber-200",
    low: "bg-blue-50 text-blue-700 border border-blue-200",
  };
  return (
    <span className={`text-[10px] uppercase font-semibold tracking-wide rounded-full px-2.5 py-0.5 ${styles[severity] ?? "bg-slate-100 text-slate-600 border border-slate-200"}`}>
      {severity}
    </span>
  );
}
