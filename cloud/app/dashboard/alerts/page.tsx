import Link from "next/link";
import { requireUser, requireActiveOrg } from "@/lib/session";
import { getDb } from "@/lib/db";
import { alertRule, project } from "@/drizzle/schema";
import { and, desc, eq } from "drizzle-orm";
import { PLAN_LIMITS, Plan } from "@/lib/plans";

export default async function AlertsPage() {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);
  const db = getDb();

  const planAllows = PLAN_LIMITS[org.plan as Plan]?.alerts ?? false;

  if (!planAllows) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Alerts</h1>
        <div className="rounded-lg border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-6 text-center">
          <p className="font-medium mb-2">Alerts are a Pro feature.</p>
          <p className="text-sm text-muted-foreground mb-4">
            Get notified in Slack, email, or webhooks when violations match your rules.
          </p>
          <Link
            href="/pricing"
            className="inline-flex h-9 items-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  const rules = await db
    .select({ rule: alertRule, projectName: project.name })
    .from(alertRule)
    .innerJoin(project, eq(project.id, alertRule.projectId))
    .where(eq(project.orgId, org.id))
    .orderBy(desc(alertRule.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Alerts</h1>
        <Link
          href="/dashboard/alerts"
          className="inline-flex h-9 items-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium"
        >
          New rule
        </Link>
      </div>

      {rules.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No alert rules yet. Create one to get notified about violations.
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          {rules.map(({ rule, projectName }) => (
            <div key={rule.id} className="px-4 py-3 flex items-center gap-4 text-sm">
              <span
                className={`text-xs uppercase rounded-full px-2 py-0.5 ${
                  rule.enabled ? "bg-green-100 text-green-800" : "bg-secondary"
                }`}
              >
                {rule.enabled ? "On" : "Off"}
              </span>
              <div className="flex-1">
                <div className="font-medium">{rule.name}</div>
                <div className="text-xs text-muted-foreground">
                  {projectName} · {rule.filterType} · {rule.filterMinSeverity}+ · {rule.channelType}
                </div>
              </div>
              <code className="text-xs text-muted-foreground truncate max-w-xs">
                {rule.channelTarget}
              </code>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
