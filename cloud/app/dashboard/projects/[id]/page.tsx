import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, requireActiveOrg } from "@/lib/session";
import { getDb } from "@/lib/db";
import { project, apiKey, event } from "@/drizzle/schema";
import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { ApiKeyManager } from "./api-key-manager";
import { formatRelativeTime, formatDate } from "@/lib/utils";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);
  const { id } = await params;
  const db = getDb();

  const projectRow = await db
    .select()
    .from(project)
    .where(and(eq(project.id, id), eq(project.orgId, org.id)))
    .limit(1);
  if (projectRow.length === 0) notFound();
  const p = projectRow[0];

  const keys = await db
    .select()
    .from(apiKey)
    .where(and(eq(apiKey.projectId, id), isNull(apiKey.revokedAt)))
    .orderBy(desc(apiKey.createdAt));

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentEvents = await db
    .select()
    .from(event)
    .where(and(eq(event.projectId, id), gte(event.occurredAt, since)))
    .orderBy(desc(event.occurredAt))
    .limit(10);

  const [{ count24h }] = await db
    .select({ count24h: sql<number>`count(*)` })
    .from(event)
    .where(and(
      eq(event.projectId, id),
      gte(event.occurredAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    ));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            ← Projects
          </Link>
          <h1 className="text-2xl font-semibold mt-1">{p.name}</h1>
          <p className="text-muted-foreground text-sm">
            {p.slug} · {p.environment}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold">{count24h}</div>
          <div className="text-xs text-muted-foreground">events / 24h</div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">API keys</h2>
        <ApiKeyManager projectId={id} keys={keys.map((k) => ({
          id: k.id,
          name: k.name,
          prefix: k.keyPrefix,
          createdAt: k.createdAt.toISOString(),
          lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
        }))} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent events</h2>
          <Link
            href={`/dashboard/events?project=${id}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all →
          </Link>
        </div>
        {recentEvents.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            No events yet. Once your SDK reports a violation, it&apos;ll appear here.
          </div>
        ) : (
          <div className="rounded-lg border divide-y">
            {recentEvents.map((e) => (
              <Link
                key={e.id}
                href={`/dashboard/events/${e.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-accent text-sm"
              >
                <SeverityBadge severity={e.severity} />
                <span className="font-mono text-xs">{e.type}</span>
                <span className="flex-1 truncate">{e.message ?? e.pattern ?? "(no message)"}</span>
                <span className="text-muted-foreground text-xs">{formatRelativeTime(e.occurredAt)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
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
