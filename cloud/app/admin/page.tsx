import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/db";
import { user, organization, event, usageDaily } from "@/drizzle/schema";
import { sql, gte, eq } from "drizzle-orm";
import { PLAN_LIMITS, Plan } from "@/lib/plans";
import { Users, Building2, Zap, TrendingUp, CreditCard, DollarSign } from "lucide-react";

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

  const maxTopOrg = topOrgs.length > 0 ? Number(topOrgs[0].total) : 1;

  function planPillStyle(plan: string) {
    if (plan === "enterprise") return "bg-purple-50 text-purple-700 border border-purple-200";
    if (plan === "team") return "bg-blue-50 text-blue-700 border border-blue-200";
    if (plan === "pro") return "bg-green-50 text-green-700 border border-green-200";
    return "bg-slate-100 text-slate-600 border border-slate-200";
  }

  return (
    <div className="px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
        <p className="text-slate-500 text-sm mt-0.5">Platform-wide metrics.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Total users"
          value={Number(totalUsers).toLocaleString()}
          icon={<Users size={18} className="text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          label="Total orgs"
          value={Number(totalOrgs).toLocaleString()}
          icon={<Building2 size={18} className="text-purple-600" />}
          iconBg="bg-purple-50"
        />
        <StatCard
          label="Events (24h)"
          value={Number(events24h).toLocaleString()}
          icon={<Zap size={18} className="text-green-600" />}
          iconBg="bg-green-50"
        />
        <StatCard
          label="Events (30d)"
          value={Number(events30d).toLocaleString()}
          icon={<TrendingUp size={18} className="text-green-600" />}
          iconBg="bg-green-50"
        />
        <StatCard
          label="Paid orgs"
          value={paidOrgs.toLocaleString()}
          icon={<CreditCard size={18} className="text-amber-600" />}
          iconBg="bg-amber-50"
        />
        <StatCard
          label="MRR (est.)"
          value={`$${mrrEstimate.toLocaleString()}`}
          icon={<DollarSign size={18} className="text-green-600" />}
          iconBg="bg-green-50"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Plan breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Plan distribution</h2>
          <div className="space-y-2">
            {planBreakdown.map((p) => (
              <div key={p.plan} className="flex items-center justify-between">
                <span className={`text-[10px] uppercase font-semibold tracking-wide rounded-full px-2.5 py-0.5 ${planPillStyle(p.plan)}`}>
                  {p.plan}
                </span>
                <span className="text-sm font-medium text-slate-700">{p.count} orgs</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top orgs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Top orgs this month</h2>
          {topOrgs.length === 0 ? (
            <p className="text-sm text-slate-500">No usage yet.</p>
          ) : (
            <div className="space-y-3">
              {topOrgs.map((o, i) => {
                const pct = Math.round((Number(o.total) / maxTopOrg) * 100);
                return (
                  <div key={o.orgId} className="flex items-center gap-3">
                    <span className="w-4 text-xs font-semibold text-slate-400 flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-800 truncate">{o.name}</span>
                        <span className="text-xs text-slate-500 tabular-nums ml-2 flex-shrink-0">
                          {Number(o.total).toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-green-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase font-semibold tracking-wide rounded-full px-2 py-0.5 flex-shrink-0 ${planPillStyle(o.plan)}`}>
                      {o.plan}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
