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
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        Create a project first to see analytics.
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-muted-foreground text-sm">Last 30 days across all projects.</p>
      </div>

      <section>
        <h2 className="font-semibold mb-3">Usage this month</h2>
        <div className="rounded-lg border p-4">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-semibold">
              {monthEvents.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              / {monthlyLimit === Infinity ? "∞" : monthlyLimit.toLocaleString()} events
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full ${usagePct > 90 ? "bg-destructive" : "bg-primary"}`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {usagePct}% of monthly quota · plan: <strong>{org.plan}</strong>
          </p>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-3">By type</h2>
          <BarList
            items={byType.map((r) => ({ label: r.type, value: r.count, total: totalEvents }))}
          />
        </div>
        <div>
          <h2 className="font-semibold mb-3">By severity</h2>
          <BarList
            items={bySeverity.map((r) => ({ label: r.severity, value: r.count, total: totalEvents }))}
          />
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Top patterns</h2>
        {topPatterns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No patterns matched yet.</p>
        ) : (
          <BarList
            items={topPatterns.map((r) => ({
              label: r.pattern ?? "(unknown)",
              value: r.count,
              total: totalEvents,
            }))}
          />
        )}
      </section>
    </div>
  );
}

function BarList({
  items,
}: {
  items: { label: string; value: number; total: number }[];
}) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No data.</p>;
  const max = Math.max(...items.map((i) => i.value));
  return (
    <div className="space-y-1">
      {items.map((i) => (
        <div key={i.label} className="text-sm">
          <div className="flex justify-between mb-0.5">
            <span className="font-mono text-xs truncate max-w-md">{i.label}</span>
            <span className="text-muted-foreground tabular-nums">{i.value.toLocaleString()}</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: `${(i.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
