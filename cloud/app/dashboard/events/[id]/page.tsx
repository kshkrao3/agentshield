import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, requireActiveOrg } from "@/lib/session";
import { getDb } from "@/lib/db";
import { event, project } from "@/drizzle/schema";
import { and, desc, eq } from "drizzle-orm";
import { formatDate } from "@/lib/utils";
import { GitBranch } from "lucide-react";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);
  const { id } = await params;
  const db = getDb();

  const [row] = await db
    .select({ event, projectName: project.name, projectId: project.id })
    .from(event)
    .innerJoin(project, eq(project.id, event.projectId))
    .where(and(eq(event.id, id), eq(project.orgId, org.id)))
    .limit(1);

  if (!row) notFound();
  const e = row.event;

  const siblings = e.sessionId
    ? await db
        .select()
        .from(event)
        .where(and(eq(event.sessionId, e.sessionId), eq(event.projectId, e.projectId)))
        .orderBy(desc(event.occurredAt))
        .limit(50)
    : [];

  const severityStyles: Record<string, string> = {
    high: "bg-red-50 text-red-700 border border-red-200",
    medium: "bg-amber-50 text-amber-700 border border-amber-200",
    low: "bg-blue-50 text-blue-700 border border-blue-200",
  };

  return (
    <div className="px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/events" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
          ← Events
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            Event <span className="font-mono text-xl text-slate-500">{e.id.slice(0, 8)}</span>
          </h1>
          <span className={`text-[10px] uppercase font-semibold tracking-wide rounded-full px-2.5 py-0.5 ${severityStyles[e.severity] ?? "bg-slate-100 text-slate-600 border border-slate-200"}`}>
            {e.severity}
          </span>
          <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
            {e.type}
          </span>
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetaCard label="Project">
          <Link href={`/dashboard/projects/${row.projectId}`} className="text-sm font-medium text-green-700 hover:underline">
            {row.projectName}
          </Link>
        </MetaCard>
        <MetaCard label="Occurred">
          <span className="text-sm text-slate-800">{formatDate(e.occurredAt)}</span>
        </MetaCard>
        <MetaCard label="SDK">
          <span className="text-sm text-slate-800">{e.sdkLanguage ?? "?"} {e.sdkVersion ?? ""}</span>
        </MetaCard>
        <MetaCard label="Source">
          <span className="text-sm text-slate-800">{e.source ?? "—"}</span>
        </MetaCard>
        <MetaCard label="Pattern" mono>
          <span className="font-mono text-xs text-slate-700 break-all">{e.pattern ?? "—"}</span>
        </MetaCard>
        <MetaCard label="Session ID" mono>
          <span className="font-mono text-xs text-slate-500 break-all">{e.sessionId ?? "—"}</span>
        </MetaCard>
      </div>

      {/* Message */}
      {e.message && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Message</h2>
          </div>
          <pre className="px-6 py-5 text-sm font-mono text-slate-800 whitespace-pre-wrap break-words bg-slate-50/50">
            {e.message}
          </pre>
        </div>
      )}

      {/* Metadata */}
      {e.metadata && Object.keys(e.metadata).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Metadata</h2>
          </div>
          <pre className="px-6 py-5 text-xs font-mono text-slate-700 whitespace-pre-wrap break-words bg-[#0a0f1a] text-green-300">
            {JSON.stringify(e.metadata, null, 2)}
          </pre>
        </div>
      )}

      {/* Session trace */}
      {siblings.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <GitBranch size={15} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Session trace</h2>
            <span className="text-xs text-slate-400">({siblings.length} events)</span>
          </div>
          <div className="divide-y divide-slate-50">
            {siblings.map((s, idx) => (
              <Link
                key={s.id}
                href={`/dashboard/events/${s.id}`}
                className={`flex items-center gap-4 px-6 py-3 hover:bg-slate-50 transition-colors text-sm ${
                  s.id === e.id ? "bg-green-50/50 border-l-2 border-green-400" : idx % 2 !== 0 ? "bg-slate-50/30" : ""
                }`}
              >
                <span className="text-xs text-slate-400 font-mono whitespace-nowrap">{formatDate(s.occurredAt)}</span>
                <span className={`text-[10px] uppercase font-semibold tracking-wide rounded-full px-2 py-0.5 flex-shrink-0 ${severityStyles[s.severity] ?? "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                  {s.severity}
                </span>
                <span className="font-mono text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded flex-shrink-0">{s.type}</span>
                <span className="flex-1 truncate text-slate-700">{s.message ?? s.pattern ?? "—"}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetaCard({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{label}</p>
      <div className={mono ? "font-mono text-xs break-all" : ""}>{children}</div>
    </div>
  );
}
