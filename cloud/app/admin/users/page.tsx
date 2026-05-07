import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/db";
import { user, orgMember, organization } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const planColors: Record<string, string> = {
  free: "bg-slate-100 text-slate-600 border border-slate-200",
  pro: "bg-green-50 text-green-700 border border-green-200",
  team: "bg-blue-50 text-blue-700 border border-blue-200",
};

export default async function AdminUsersPage() {
  await requireAdmin();
  const db = getDb();

  const rows = await db
    .select({
      user,
      orgName: organization.name,
      orgPlan: organization.plan,
    })
    .from(user)
    .leftJoin(orgMember, eq(orgMember.userId, user.id))
    .leftJoin(organization, eq(organization.id, orgMember.orgId))
    .orderBy(desc(user.createdAt));

  return (
    <div className="px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
        <p className="text-sm text-slate-500 mt-0.5">{rows.length} total</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Org</th>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Plan</th>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map(({ user: u, orgName, orgPlan }) => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-3.5 font-medium text-slate-800">{u.name ?? "—"}</td>
                <td className="px-6 py-3.5 font-mono text-xs text-slate-500">{u.email}</td>
                <td className="px-6 py-3.5 text-slate-600 text-sm">{orgName ?? "—"}</td>
                <td className="px-6 py-3.5">
                  {orgPlan ? (
                    <span className={`text-[10px] uppercase font-semibold tracking-wide rounded-full px-2.5 py-0.5 ${planColors[orgPlan] ?? "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                      {orgPlan}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-6 py-3.5 text-xs text-slate-400">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-slate-400">No users yet.</div>
        )}
      </div>
    </div>
  );
}
