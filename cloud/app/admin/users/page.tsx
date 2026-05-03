import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/db";
import { user, orgMember, organization } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">{rows.length} total</p>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Email</th>
              <th className="text-left px-4 py-2 font-medium">Org</th>
              <th className="text-left px-4 py-2 font-medium">Plan</th>
              <th className="text-left px-4 py-2 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(({ user: u, orgName, orgPlan }) => (
              <tr key={u.id} className="hover:bg-accent">
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2 font-mono text-xs">{u.email}</td>
                <td className="px-4 py-2 text-muted-foreground">{orgName ?? "—"}</td>
                <td className="px-4 py-2">
                  {orgPlan ? (
                    <span className="text-xs uppercase rounded-full bg-secondary px-2 py-0.5">{orgPlan}</span>
                  ) : "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground text-xs">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
