import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/db";
import { usageDaily, organization } from "@/drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { PLAN_LIMITS, Plan } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function AdminUsagePage() {
  await requireAdmin();
  const db = getDb();

  const thisMonth = new Date().toISOString().slice(0, 7);

  const byOrg = await db
    .select({
      orgId: usageDaily.orgId,
      name: organization.name,
      plan: organization.plan,
      thisMonth: sql<number>`coalesce(sum(case when ${usageDaily.day} like ${thisMonth + "%"} then ${usageDaily.eventCount} else 0 end), 0)`,
      allTime: sql<number>`coalesce(sum(${usageDaily.eventCount}), 0)`,
    })
    .from(usageDaily)
    .innerJoin(organization, eq(organization.id, usageDaily.orgId))
    .groupBy(usageDaily.orgId)
    .orderBy(desc(sql`sum(${usageDaily.eventCount})`));

  const daily = await db
    .select({
      day: usageDaily.day,
      total: sql<number>`sum(${usageDaily.eventCount})`,
    })
    .from(usageDaily)
    .where(sql`${usageDaily.day} >= ${new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)}`)
    .groupBy(usageDaily.day)
    .orderBy(desc(usageDaily.day))
    .limit(30);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Usage</h1>

      <section>
        <h2 className="font-semibold mb-3">By org — this month vs all time</h2>
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Org</th>
                <th className="text-left px-4 py-2 font-medium">Plan</th>
                <th className="text-right px-4 py-2 font-medium">Limit</th>
                <th className="text-right px-4 py-2 font-medium">This month</th>
                <th className="text-right px-4 py-2 font-medium">All time</th>
                <th className="text-left px-4 py-2 font-medium">Quota</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {byOrg.map((o) => {
                const limit = PLAN_LIMITS[o.plan as Plan]?.monthlyEvents ?? 10000;
                const pct = limit === Infinity ? 0 : Math.min(100, Math.round((Number(o.thisMonth) / limit) * 100));
                return (
                  <tr key={o.orgId} className="hover:bg-accent">
                    <td className="px-4 py-2 font-medium">{o.name}</td>
                    <td className="px-4 py-2">
                      <span className="text-xs uppercase rounded-full bg-secondary px-2 py-0.5">{o.plan}</span>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted-foreground text-xs">
                      {limit === Infinity ? "∞" : limit.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{Number(o.thisMonth).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{Number(o.allTime).toLocaleString()}</td>
                    <td className="px-4 py-2 w-32">
                      {limit !== Infinity && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className={`h-full ${pct > 90 ? "bg-red-500" : "bg-green-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Daily totals (last 30 days)</h2>
        <div className="rounded-lg border divide-y">
          {daily.map((d) => (
            <div key={d.day} className="px-4 py-2 flex justify-between text-sm">
              <span className="font-mono text-xs">{d.day}</span>
              <span className="tabular-nums">{Number(d.total).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
