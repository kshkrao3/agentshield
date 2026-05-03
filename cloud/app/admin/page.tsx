import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/db";
import { user, organization, event, usageDaily } from "@/drizzle/schema";
import { sql, gte, eq } from "drizzle-orm";
import { PLAN_LIMITS, Plan } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const db = getDb();

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date().toISOString().slice(0, 7);

  const [
    [{ totalUsers }],
    [{ totalOrgs }],
    [{ events24h }],
    [{ events30d }],
    planBreakdown,
    topOrgs,
  ] = await Promise.all([
    db.select({ totalUsers: sql<number>`count(*)` }).from(user),
    db.select({ totalOrgs: sql<number>`count(*)` }).from(organization),
    db.select({ events24h: sql<number>`count(*)` }).from(event).where(gte(event.occurredAt, since24h)),
    db.select({ events30d: sql<number>`count(*)` }).from(event).where(gte(event.occurredAt, since30d)),
    db.select({ plan: organization.plan, count: sql<number>`count(*)` })
      .from(organization).groupBy(organization.plan),
    db.select({ orgId: usageDaily.orgId, name: organization.name, plan: organization.plan, total: sql<number>`sum(${usageDaily.eventCount})` })
      .from(usageDaily)
      .innerJoin(organization, eq(organization.id, usageDaily.orgId))
      .where(sql`${usageDaily.day} like ${thisMonth + "%"}`)
      .groupBy(usageDaily.orgId)
      .orderBy(sql`sum(${usageDaily.eventCount}) desc`)
      .limit(5),
  ]);

  const paidOrgs = planBreakdown.filter((p) => p.plan !== "free").reduce((a, b) => a + b.count, 0);
  const mrrEstimate = planBreakdown.reduce((acc, p) => {
    const price = PLAN_LIMITS[p.plan as Plan]?.monthlyPriceUsd ?? 0;
    return acc + (price ?? 0) * p.count;
  }, 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Overview</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total users" value={totalUsers.toLocaleString()} />
        <StatCard label="Total orgs" value={totalOrgs.toLocaleString()} />
        <StatCard label="Events (24h)" value={events24h.toLocaleString()} />
        <StatCard label="Events (30d)" value={events30d.toLocaleString()} />
        <StatCard label="Paid orgs" value={paidOrgs.toLocaleString()} />
        <StatCard label="MRR (est.)" value={`$${mrrEstimate}`} />
      </div>

      <section>
        <h2 className="font-semibold mb-3">Plan distribution</h2>
        <div className="rounded-lg border divide-y">
          {planBreakdown.map((p) => (
            <div key={p.plan} className="px-4 py-3 flex justify-between text-sm">
              <span className="uppercase font-mono text-xs">{p.plan}</span>
              <span>{p.count} orgs</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Top orgs this month</h2>
        <div className="rounded-lg border divide-y">
          {topOrgs.length === 0 && (
            <p className="px-4 py-3 text-sm text-muted-foreground">No usage yet.</p>
          )}
          {topOrgs.map((o) => (
            <div key={o.orgId} className="px-4 py-3 flex justify-between text-sm">
              <span>{o.name} <span className="text-muted-foreground text-xs uppercase ml-2">{o.plan}</span></span>
              <span>{Number(o.total).toLocaleString()} events</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
