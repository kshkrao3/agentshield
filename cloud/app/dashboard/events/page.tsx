import Link from "next/link";
import { requireUser, requireActiveOrg } from "@/lib/session";
import { getDb } from "@/lib/db";
import { event, project } from "@/drizzle/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { formatRelativeTime } from "@/lib/utils";
import { EventFilters } from "./filters";

interface SearchParams {
  type?: string;
  severity?: string;
  project?: string;
  range?: string;
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);
  const sp = await searchParams;
  const db = getDb();

  const orgProjects = await db
    .select({ id: project.id, name: project.name })
    .from(project)
    .where(eq(project.orgId, org.id));
  const projectIds = orgProjects.map((p) => p.id);

  if (projectIds.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        Create a project first to see events.
        <div className="mt-4">
          <Link href="/dashboard" className="underline">Go to projects</Link>
        </div>
      </div>
    );
  }

  const rangeHours = parseRange(sp.range);
  const since = new Date(Date.now() - rangeHours * 60 * 60 * 1000);

  const conditions = [
    gte(event.occurredAt, since),
  ];
  if (sp.project && projectIds.includes(sp.project)) {
    conditions.push(eq(event.projectId, sp.project));
  }
  if (sp.type && ["injection", "tool", "memory"].includes(sp.type)) {
    conditions.push(eq(event.type, sp.type as "injection" | "tool" | "memory"));
  }
  if (sp.severity && ["low", "medium", "high"].includes(sp.severity)) {
    conditions.push(eq(event.severity, sp.severity as "low" | "medium" | "high"));
  }

  const rows = await db
    .select({
      event,
      projectName: project.name,
    })
    .from(event)
    .innerJoin(project, eq(project.id, event.projectId))
    .where(and(eq(project.orgId, org.id), ...conditions))
    .orderBy(desc(event.occurredAt))
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Events</h1>
        <p className="text-muted-foreground text-sm">
          Showing latest 200 events across your projects.
        </p>
      </div>
      <EventFilters projects={orgProjects} current={sp} />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No events match your filters.
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Severity</th>
                <th className="text-left px-4 py-2 font-medium">Type</th>
                <th className="text-left px-4 py-2 font-medium">Project</th>
                <th className="text-left px-4 py-2 font-medium">Message</th>
                <th className="text-left px-4 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map(({ event: e, projectName }) => (
                <tr key={e.id} className="hover:bg-accent">
                  <td className="px-4 py-2">
                    <SeverityBadge severity={e.severity} />
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{e.type}</td>
                  <td className="px-4 py-2 text-muted-foreground">{projectName}</td>
                  <td className="px-4 py-2 max-w-md">
                    <Link href={`/dashboard/events/${e.id}`} className="block truncate hover:underline">
                      {e.message ?? e.pattern ?? "(no message)"}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground text-xs whitespace-nowrap">
                    {formatRelativeTime(e.occurredAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function parseRange(range: string | undefined): number {
  switch (range) {
    case "1h": return 1;
    case "24h": return 24;
    case "7d": return 24 * 7;
    case "30d": return 24 * 30;
    default: return 24;
  }
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };
  return (
    <span className={`text-xs uppercase rounded-full px-2 py-0.5 font-medium ${colors[severity] ?? ""}`}>
      {severity}
    </span>
  );
}
