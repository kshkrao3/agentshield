import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, requireActiveOrg } from "@/lib/session";
import { getDb } from "@/lib/db";
import { event, project } from "@/drizzle/schema";
import { and, desc, eq } from "drizzle-orm";
import { formatDate } from "@/lib/utils";

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

  // Sibling events in same session for the trace view.
  const siblings = e.sessionId
    ? await db
        .select()
        .from(event)
        .where(and(eq(event.sessionId, e.sessionId), eq(event.projectId, e.projectId)))
        .orderBy(desc(event.occurredAt))
        .limit(50)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/events" className="text-sm text-muted-foreground hover:text-foreground">
          ← Events
        </Link>
        <h1 className="text-2xl font-semibold mt-1">Event {e.id.slice(0, 8)}</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Severity" value={e.severity} highlight />
        <Field label="Type" value={e.type} />
        <Field label="Project" value={row.projectName} link={`/dashboard/projects/${row.projectId}`} />
        <Field label="Occurred" value={formatDate(e.occurredAt)} />
        <Field label="SDK" value={`${e.sdkLanguage ?? "?"} ${e.sdkVersion ?? ""}`} />
        <Field label="Source" value={e.source ?? "—"} />
        <Field label="Session ID" value={e.sessionId ?? "—"} mono />
        <Field label="Pattern" value={e.pattern ?? "—"} mono />
      </div>

      {e.message && (
        <section>
          <h2 className="font-semibold mb-2">Message</h2>
          <pre className="rounded-lg border bg-muted p-4 text-sm font-mono whitespace-pre-wrap break-words">
            {e.message}
          </pre>
        </section>
      )}

      {e.metadata && Object.keys(e.metadata).length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">Metadata</h2>
          <pre className="rounded-lg border bg-muted p-4 text-sm font-mono whitespace-pre-wrap break-words">
            {JSON.stringify(e.metadata, null, 2)}
          </pre>
        </section>
      )}

      {siblings.length > 1 && (
        <section>
          <h2 className="font-semibold mb-2">Session trace ({siblings.length} events)</h2>
          <div className="rounded-lg border divide-y text-sm">
            {siblings.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/events/${s.id}`}
                className={`flex gap-4 px-4 py-2 hover:bg-accent ${s.id === e.id ? "bg-accent" : ""}`}
              >
                <span className="text-xs text-muted-foreground font-mono">
                  {formatDate(s.occurredAt)}
                </span>
                <span className="text-xs uppercase">{s.severity}</span>
                <span className="font-mono text-xs">{s.type}</span>
                <span className="flex-1 truncate">{s.message ?? s.pattern ?? "—"}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  highlight,
  mono,
  link,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
  link?: string;
}) {
  const content = (
    <div className={`rounded-lg border p-3 ${highlight ? "border-amber-500" : ""}`}>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className={`mt-1 ${mono ? "font-mono text-xs break-all" : "text-sm"}`}>
        {value}
      </div>
    </div>
  );
  return link ? <Link href={link as never}>{content}</Link> : content;
}
