import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/db";
import { organization, user, project, usageDaily } from "@/drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const planColors: Record<string, string> = {
  free: "bg-slate-100 text-slate-600 border border-slate-200",
  pro: "bg-green-50 text-green-700 border border-green-200",
  team: "bg-blue-50 text-blue-700 border border-blue-200",
};

export default async function AdminOrgsPage() {
  await requireAdmin();
  const db = getDb();

  const thisMonth = new Date().toISOString().slice(0, 7);

  const orgs = await db
    .select({
      org: organization,
      ownerEmail: user.email,
      projectCount: sql<number>`count(distinct ${project.id})`,
      monthEvents: sql<number>`coalesce(sum(case when ${usageDaily.day} like ${thisMonth + "%"} then ${usageDaily.eventCount} else 0 end), 0)`,
    })
    .from(organization)
    .leftJoin(user, eq(user.id, organization.ownerId))
    .leftJoin(project, eq(project.orgId, organization.id))
    .leftJoin(usageDaily, eq(usageDaily.orgId, organization.id))
    .groupBy(organization.id)
    .orderBy(desc(organization.createdAt));

  return (
    <div className="px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Orgs & Billing</h1>
        <p className="text-sm text-slate-500 mt-0.5">{orgs.length} orgs</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Org</th>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</th>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Plan</th>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Projects</th>
              <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Events (mo)</th>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Renews</th>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">LS Sub ID</th>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orgs.map(({ org, ownerEmail, projectCount, monthEvents }) => (
              <tr key={org.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-3.5 font-medium text-slate-800 whitespace-nowrap">{org.name}</td>
                <td className="px-6 py-3.5 font-mono text-xs text-slate-400 whitespace-nowrap">{ownerEmail ?? "—"}</td>
                <td className="px-6 py-3.5">
                  <span className={`text-[10px] uppercase font-semibold tracking-wide rounded-full px-2.5 py-0.5 ${planColors[org.plan] ?? "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                    {org.plan}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  {org.subscriptionStatus ? (
                    <span className={`text-[10px] uppercase font-semibold tracking-wide rounded-full px-2.5 py-0.5 ${
                      org.subscriptionStatus === "active"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {org.subscriptionStatus}
                    </span>
                  ) : <span className="text-slate-400 text-xs">—</span>}
                </td>
                <td className="px-6 py-3.5 text-right tabular-nums text-slate-700">{projectCount}</td>
                <td className="px-6 py-3.5 text-right tabular-nums text-slate-700">{Number(monthEvents).toLocaleString()}</td>
                <td className="px-6 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                  {org.currentPeriodEnd ? formatDate(org.currentPeriodEnd) : "—"}
                </td>
                <td className="px-6 py-3.5 font-mono text-xs text-slate-400 truncate max-w-[12rem]">
                  {org.lsSubscriptionId ?? "—"}
                </td>
                <td className="px-6 py-3.5 text-xs text-slate-400 whitespace-nowrap">{formatDate(org.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orgs.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-slate-400">No orgs yet.</div>
        )}
      </div>
    </div>
  );
}
