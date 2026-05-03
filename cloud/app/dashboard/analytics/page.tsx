import { requireUser, requireActiveOrg } from "@/lib/session";
import { getDb } from "@/lib/db";
import { event, project, usageDaily } from "@/drizzle/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { PLAN_LIMITS, Plan } from "@/lib/plans";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);
  const db = getDb();

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const orgProjectIds = (await db
    .select({ id: project.id })
    .from(project)
    .where(eq(project.orgId, org.id))).map((p) => p.id);

  if (orgProjectIds.length === 0) {
    return (
      <div className="px-8 py-8">
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-500">
          Create a project first to see analytics.
        </div>
      </div>
    );
  }

  const byType = await db
    .select({
      type: event.type,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(event)
    .innerJoin(project, eq(project.id, event.projectId))
    .where(and(eq(project.orgId, org.id), gte(event.occurredAt, since30d)))
    .groupBy(event.type);

  const bySeverity = await db
    .select({
      severity: event.severity,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(event)
    .innerJoin(project, eq(project.id, event.projectId))
    .where(and(eq(project.orgId, org.id), gte(event.occurredAt, since30d)))
    .groupBy(event.severity);

  const topPatterns = await db
    .select({
      pattern: event.pattern,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(event)
    .innerJoin(project, eq(project.id, event.projectId))
    .where(and(eq(project.orgId, org.id), gte(event.occurredAt, since30d)))
    .groupBy(event.pattern)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  const usage = await db
    .select()
    .from(usageDaily)
    .where(and(eq(usageDaily.orgId, org.id)))
    .orderBy(desc(usageDaily.day))
    .limit(30);

  const totalEvents = byType.reduce((acc, r) => acc + r.count, 0);
  const monthlyLimit = PLAN_LIMITS[org.plan as Plan]?.monthlyEvents ?? PLAN_LIMITS.free.monthlyEvents;
  const monthEvents = usage
    .filter((u) => u.day.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((acc, u) => acc + u.eventCount, 0);
  const usagePct = Math.min(100, Math.round((monthEvents / monthlyLimit) * 100));

  function progressColor(pct: number) {
    if (pct >= 90) return "from-red-400 to-red-600";
    if (pct >= 70) return "from-amber-400 to-amber-500";
    return "from-green-400 to-green-600";
  }

  function typeColor(type: string) {
    if (type === "injection") return "bg-red-500";
    if (type === "tool") return "bg-amber-400";
    if (type === "memory") return "bg-purple-500";
    return "bg-slate-400";
  }

  function severityColor(sev: string) {
    if (sev === "high") return "bg-red-500";
    if (sev === "medium") return "bg-amber-400";
    if (sev === "low") return "bg-blue-500";
    return "bg-slate-400";
  }

  return (
    <div className="px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
        <p className="text-slate-500 text-sm mt-0.5">Last 30 days across all projects.</p>
      </div>

      {/* Usage quota */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-900">Monthly quota</h2>
            <p className="text-xs text-slate-500 mt-0.5 capitalize">{org.plan} plan</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-slate-900">{usagePct}%</span>
            <p className="text-xs text-slate-400 mt-0.5">used</p>
          </div>
        </div>
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden mb-3">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${progressColor(usagePct)} transition-all`}
            style={{ width: `${usagePct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>{monthEvents.toLocaleString()} events used</span>
          <span>{monthlyLimit === Infinity ? "Unlimited" : monthlyLimit.toLocaleString()} limit</span>
        </div>
      </div>

      {/* Type + Severity */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">By type</h2>
          <ColorBarList
            items={byType.map((r) => ({ label: r.type, value: r.count, color: typeColor(r.type) }))}
          />
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">By severity</h2>
          <ColorBarList
            items={bySeverity.map((r) => ({ label: r.severity, value: r.count, color: severityColor(r.severity) }))}
          />
        </div>
      </div>

      {/* Top patterns */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Top patterns</h2>
        {topPatterns.length === 0 ? (
          <p className="text-sm text-slate-500">No patterns matched yet.</p>
        ) : (
          <div className="space-y-3">
            {topPatterns.map((r, i) => {
              const max = topPatterns[0].count;
              const pct = Math.round((r.count / max) * 100);
              return (
                <div key={r.pattern ?? i} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-semibold text-slate-400 text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-slate-700 truncate max-w-xs">
                        {r.pattern ?? "(unknown)"}
                      </span>
                      <span className="text-xs text-slate-500 tabular-nums ml-2 flex-shrink-0">
                        {r.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ColorBarList({
  items,
}: {
  items: { label: string; value: number; color: string }[];
}) {
  if (items.length === 0) return <p className="text-sm text-slate-500">No data.</p>;
  const max = Math.max(...items.map((i) => i.value));
  return (
    <div className="space-y-3">
      {items.map((i) => (
        <div key={i.label}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-slate-700 capitalize">{i.label}</span>
            <span className="text-sm text-slate-500 tabular-nums">{i.value.toLocaleString()}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${i.color}`}
              style={{ width: `${(i.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
