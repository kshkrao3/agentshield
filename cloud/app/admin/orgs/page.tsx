import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/db";
import { organization, user, project, usageDaily } from "@/drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Orgs & Billing</h1>
        <p className="text-sm text-muted-foreground">{orgs.length} orgs</p>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Org</th>
              <th className="text-left px-4 py-2 font-medium">Owner</th>
              <th className="text-left px-4 py-2 font-medium">Plan</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Projects</th>
              <th className="text-left px-4 py-2 font-medium">Events (mo)</th>
              <th className="text-left px-4 py-2 font-medium">Renews</th>
              <th className="text-left px-4 py-2 font-medium">LS Sub ID</th>
              <th className="text-left px-4 py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orgs.map(({ org, ownerEmail, projectCount, monthEvents }) => (
              <tr key={org.id} className="hover:bg-accent">
                <td className="px-4 py-2 font-medium whitespace-nowrap">{org.name}</td>
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground whitespace-nowrap">{ownerEmail ?? "—"}</td>
                <td className="px-4 py-2">
                  <span className="text-xs uppercase rounded-full bg-secondary px-2 py-0.5">{org.plan}</span>
                </td>
                <td className="px-4 py-2 text-xs">
                  {org.subscriptionStatus ? (
                    <span className={`rounded-full px-2 py-0.5 ${
                      org.subscriptionStatus === "active" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {org.subscriptionStatus}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-2 text-center">{projectCount}</td>
                <td className="px-4 py-2 text-right tabular-nums">{Number(monthEvents).toLocaleString()}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                  {org.currentPeriodEnd ? formatDate(org.currentPeriodEnd) : "—"}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground truncate max-w-xs">
                  {org.lsSubscriptionId ?? "—"}
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">{formatDate(org.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
