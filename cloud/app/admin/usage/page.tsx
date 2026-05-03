import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/db";
import { usageDaily, organization } from "@/drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { PLAN_LIMITS, Plan } from "@/lib/plans";

export const dynamic = "force-dynamic";

const planColors: Record<string, string> = {
  free: "bg-slate-100 text-slate-600 border border-slate-200",
  pro: "bg-green-50 text-green-700 border border-green-200",
  team: "bg-blue-50 text-blue-700 border border-blue-200",
};

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

  const maxDaily = Math.max(...daily.map((d) => Number(d.total)), 1);

  return (
    <div className="px-8 py-8 space-y-8">
      <h1 className="text-2xl font-semibold text-slate-900">Usage</h1>

      {/* By org */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">By org — this month vs all time</h2>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Org</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Plan</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Limit</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">This month</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">All time</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Quota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {byOrg.map((o) => {
                const limit = PLAN_LIMITS[o.plan as Plan]?.monthlyEvents ?? 10000;
                const pct = limit === Infinity ? 0 : Math.min(100, Math.round((Number(o.thisMonth) / limit) * 100));
                return (
                  <tr key={o.orgId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-800">{o.name}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-[10px] uppercase font-semibold tracking-wide rounded-full px-2.5 py-0.5 ${planColors[o.plan] ?? "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                        {o.plan}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right tabular-nums text-slate-400 text-xs">
                      {limit === Infinity ? "∞" : limit.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right tabular-nums text-slate-700 font-medium">
                      {Number(o.thisMonth).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right tabular-nums text-slate-400">
                      {Number(o.allTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 w-36">
                      {limit !== Infinity ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-400" : "bg-green-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 tabular-nums w-8 text-right">{pct}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">unlimited</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {byOrg.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-slate-400">No usage data yet.</div>
          )}
        </div>
      </section>

      {/* Daily totals */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Daily totals — last 30 days</h2>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {daily.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-400">No data yet.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {daily.map((d) => {
                const pct = Math.round((Number(d.total) / maxDaily) * 100);
                return (
                  <div key={d.day} className="px-6 py-3 flex items-center gap-4">
                    <span className="font-mono text-xs text-slate-500 w-24 flex-shrink-0">{d.day}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm tabular-nums text-slate-700 w-16 text-right font-medium">
                      {Number(d.total).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
