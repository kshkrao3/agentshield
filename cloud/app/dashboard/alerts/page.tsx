import Link from "next/link";
import { requireUser, requireActiveOrg } from "@/lib/session";
import { getDb } from "@/lib/db";
import { alertRule, project } from "@/drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { PLAN_LIMITS, Plan } from "@/lib/plans";
import { Bell, Zap } from "lucide-react";

export default async function AlertsPage() {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);
  const db = getDb();

  const planAllows = PLAN_LIMITS[org.plan as Plan]?.alerts ?? false;

  if (!planAllows) {
    return (
      <div className="px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Alerts</h1>
          <p className="text-slate-500 text-sm mt-0.5">Get notified when violations match your rules.</p>
        </div>
        <div className="bg-white rounded-2xl border border-amber-200 p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Bell size={28} className="text-amber-500" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Alerts are a Pro feature</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            Get notified in Slack, email, or webhooks when violations match your rules.
          </p>
          <Link
            href="/pricing"
            className="inline-flex h-9 items-center rounded-xl bg-green-600 text-white px-5 text-sm font-medium hover:bg-green-700 transition-colors"
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
    <div className="px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Alerts</h1>
          <p className="text-slate-500 text-sm mt-0.5">Notification rules for security events.</p>
        </div>
        <Link
          href="/dashboard/alerts/new"
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-green-600 text-white px-4 text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <Zap size={14} />
          New rule
        </Link>
      </div>

      {rules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
            <Bell size={28} className="text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">No alert rules yet</h3>
          <p className="text-slate-500 text-sm mb-6">Create one to get notified about violations.</p>
          <Link
            href="/dashboard/alerts/new"
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-green-600 text-white px-4 text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <Zap size={14} />
            New rule
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(({ rule, projectName }) => (
            <div
              key={rule.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4"
            >
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  rule.enabled ? "bg-green-400" : "bg-slate-300"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 text-sm">{rule.name}</div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>{projectName}</span>
                  <span className="text-slate-300">·</span>
                  <span className="font-mono">{rule.filterType}</span>
                  <span className="text-slate-300">·</span>
                  <SeverityPill severity={rule.filterMinSeverity} />
                  <span className="text-slate-300">·</span>
                  <span>{rule.channelType}</span>
                </div>
              </div>
              <span
                className={`text-[10px] uppercase font-semibold tracking-wide rounded-full px-2.5 py-0.5 flex-shrink-0 ${
                  rule.enabled
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-slate-100 text-slate-500 border border-slate-200"
                }`}
              >
                {rule.enabled ? "Active" : "Off"}
              </span>
              <code className="text-xs text-slate-400 truncate max-w-xs hidden md:block">
                {rule.channelTarget}
              </code>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SeverityPill({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    high: "text-red-600",
    medium: "text-amber-600",
    low: "text-blue-600",
  };
  return (
    <span className={`capitalize ${styles[severity] ?? "text-slate-600"}`}>
      {severity}+
    </span>
  );
}
