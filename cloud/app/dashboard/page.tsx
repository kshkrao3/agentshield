import Link from "next/link";
import { requireUser, requireActiveOrg } from "@/lib/session";
import { getDb } from "@/lib/db";
import { project, event } from "@/drizzle/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { CreateProjectButton } from "./create-project-button";
import { formatRelativeTime } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);
  const db = getDb();

  const projects = await db
    .select()
    .from(project)
    .where(eq(project.orgId, org.id))
    .orderBy(desc(project.createdAt));

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentCounts = await db
    .select({
      projectId: event.projectId,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(event)
    .innerJoin(project, eq(project.id, event.projectId))
    .where(and(eq(project.orgId, org.id), gte(event.occurredAt, since)))
    .groupBy(event.projectId);

  const countMap = new Map(recentCounts.map((c: { projectId: string; count: number }) => [c.projectId, c.count]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-muted-foreground text-sm">
            Each project gets its own API key and event stream.
          </p>
        </div>
        <CreateProjectButton orgPlan={org.plan} />
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground mb-4">No projects yet.</p>
          <CreateProjectButton orgPlan={org.plan} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/projects/${p.id}`}
              className="rounded-lg border p-5 hover:border-foreground transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{p.name}</h3>
                <span className="text-xs uppercase rounded-full bg-secondary px-2 py-0.5">
                  {p.environment}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{p.slug}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold">
                  {countMap.get(p.id) ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">events / 24h</span>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Created {formatRelativeTime(p.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
