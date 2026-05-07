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
      <div className="px-8 py-8">
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-500">
          Create a project first to see events.
          <div className="mt-4">
            <Link href="/dashboard" className="text-green-600 underline text-sm">Go to projects</Link>
          </div>
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
    <div className="px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Events</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Showing latest 200 events across your projects.
        </p>
      </div>

      {/* Filter bar */}
      <EventFilters projects={orgProjects} current={sp} />

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-500">
          No events match your filters.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 sticky top-0">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Severity</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Project</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Message</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">When</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ event: e, projectName }, idx) => (
                  <tr
                    key={e.id}
                    className={`border-b border-slate-50 hover:bg-slate-50/80 transition-colors ${
                      idx % 2 === 0 ? "" : "bg-slate-50/30"
                    }`}
                  >
                    <td className="px-5 py-3">
                      <SeverityBadge severity={e.severity} />
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {e.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{projectName}</td>
                    <td className="px-5 py-3 max-w-md">
                      <Link
                        href={`/dashboard/events/${e.id}`}
                        className="block truncate text-slate-800 hover:text-green-700 hover:underline"
                      >
                        {e.message ?? e.pattern ?? "(no message)"}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {formatRelativeTime(e.occurredAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
  const styles: Record<string, string> = {
    high: "bg-red-50 text-red-700 border border-red-200",
    medium: "bg-amber-50 text-amber-700 border border-amber-200",
    low: "bg-blue-50 text-blue-700 border border-blue-200",
  };
  return (
    <span className={`text-[10px] uppercase font-semibold tracking-wide rounded-full px-2.5 py-0.5 ${styles[severity] ?? "bg-slate-100 text-slate-600 border border-slate-200"}`}>
      {severity}
    </span>
  );
}
