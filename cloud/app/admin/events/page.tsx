import Link from "next/link";
import type { Route } from "next";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/db";
import { event, project, organization } from "@/drizzle/schema";
import { desc, eq, gte, and, sql } from "drizzle-orm";
import { formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const severityStyles: Record<string, string> = {
  high: "bg-red-50 text-red-700 border border-red-200",
  medium: "bg-amber-50 text-amber-700 border border-amber-200",
  low: "bg-blue-50 text-blue-700 border border-blue-200",
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
    <div className="px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Global Events</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {Number(total).toLocaleString()} events — showing latest 200
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-16 text-center text-sm text-slate-400">
          No events match your filters.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Severity</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Org</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Project</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Message</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(({ event: e, projectName, orgName }) => (
                <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5">
                    <span className={`text-[10px] uppercase font-semibold tracking-wide rounded-full px-2.5 py-0.5 ${severityStyles[e.severity] ?? "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                      {e.severity}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{e.type}</span>
                  </td>
                  <td className="px-6 py-3.5 text-xs text-slate-500">{orgName}</td>
                  <td className="px-6 py-3.5 text-xs text-slate-500">{projectName}</td>
                  <td className="px-6 py-3.5 max-w-sm truncate text-xs text-slate-700">
                    {e.message ?? e.pattern ?? "(no message)"}
                  </td>
                  <td className="px-6 py-3.5 text-xs text-slate-400 whitespace-nowrap">
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
    <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1">
      <Link
        href={`${base}&${param}=` as Route}
        className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
          !current || current === defaultValue
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        All
      </Link>
      {options.map((o) => (
        <Link
          key={o.value}
          href={`${base}&${param}=${o.value}` as Route}
          className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
            current === o.value
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}
