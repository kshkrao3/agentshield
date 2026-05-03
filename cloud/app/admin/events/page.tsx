import Link from "next/link";
import type { Route } from "next";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/db";
import { event, project, organization } from "@/drizzle/schema";
import { desc, eq, gte, and, sql } from "drizzle-orm";
import { formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; type?: string; severity?: string }>;
}) {
  await requireAdmin();
  const db = getDb();
  const sp = await searchParams;

  const rangeHours = sp.range === "1h" ? 1 : sp.range === "7d" ? 168 : sp.range === "30d" ? 720 : 24;
  const since = new Date(Date.now() - rangeHours * 3600000);

  const conditions = [gte(event.occurredAt, since)];
  if (sp.type && ["injection", "tool", "memory"].includes(sp.type))
    conditions.push(eq(event.type, sp.type as "injection" | "tool" | "memory"));
  if (sp.severity && ["low", "medium", "high"].includes(sp.severity))
    conditions.push(eq(event.severity, sp.severity as "low" | "medium" | "high"));

  const [rows, [{ total }]] = await Promise.all([
    db.select({ event, projectName: project.name, orgName: organization.name })
      .from(event)
      .innerJoin(project, eq(project.id, event.projectId))
      .innerJoin(organization, eq(organization.id, project.orgId))
      .where(and(...conditions))
      .orderBy(desc(event.occurredAt))
      .limit(200),
    db.select({ total: sql<number>`count(*)` }).from(event).where(and(...conditions)),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Global Events</h1>
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString()} events — showing latest 200.
        </p>
      </div>

      <div className="flex gap-3 text-sm flex-wrap">
        <FilterGroup
          param="range"
          current={sp.range}
          base={`/admin/events?type=${sp.type ?? ""}&severity=${sp.severity ?? ""}`}
          options={[
            { value: "1h", label: "1h" },
            { value: "24h", label: "24h" },
            { value: "7d", label: "7d" },
            { value: "30d", label: "30d" },
          ]}
          defaultValue="24h"
        />
        <FilterGroup
          param="type"
          current={sp.type}
          base={`/admin/events?range=${sp.range ?? ""}&severity=${sp.severity ?? ""}`}
          options={[
            { value: "injection", label: "Injection" },
            { value: "tool", label: "Tool" },
            { value: "memory", label: "Memory" },
          ]}
          defaultValue=""
        />
        <FilterGroup
          param="severity"
          current={sp.severity}
          base={`/admin/events?range=${sp.range ?? ""}&type=${sp.type ?? ""}`}
          options={[
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
          ]}
          defaultValue=""
        />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No events match your filters.
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Sev</th>
                <th className="text-left px-4 py-2 font-medium">Type</th>
                <th className="text-left px-4 py-2 font-medium">Org</th>
                <th className="text-left px-4 py-2 font-medium">Project</th>
                <th className="text-left px-4 py-2 font-medium">Message</th>
                <th className="text-left px-4 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map(({ event: e, projectName, orgName }) => (
                <tr key={e.id} className="hover:bg-accent">
                  <td className="px-4 py-2">
                    <span className={`text-xs uppercase rounded-full px-2 py-0.5 font-medium ${SEVERITY_COLORS[e.severity] ?? ""}`}>
                      {e.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{e.type}</td>
                  <td className="px-4 py-2 text-muted-foreground text-xs">{orgName}</td>
                  <td className="px-4 py-2 text-muted-foreground text-xs">{projectName}</td>
                  <td className="px-4 py-2 max-w-sm truncate text-xs">
                    {e.message ?? e.pattern ?? "(no message)"}
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

function FilterGroup({
  param, current, base, options, defaultValue,
}: {
  param: string; current?: string; base: string;
  options: { value: string; label: string }[];
  defaultValue: string;
}) {
  return (
    <div className="flex gap-1 rounded-md border p-1">
      <Link
        href={`${base}&${param}=` as Route}
        className={`rounded px-2 py-0.5 text-xs ${!current || current === defaultValue ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
      >
        All
      </Link>
      {options.map((o) => (
        <Link
          key={o.value}
          href={`${base}&${param}=${o.value}` as Route}
          className={`rounded px-2 py-0.5 text-xs ${current === o.value ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}
