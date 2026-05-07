import { requireUser, requireActiveOrg } from "@/lib/session";
import { getDb } from "@/lib/db";
import { project } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { PLAN_LIMITS, Plan } from "@/lib/plans";
import Link from "next/link";
import { Bell } from "lucide-react";
import { NewAlertForm } from "./form";
import { UpgradeModal } from "@/components/upgrade-modal";

export default async function NewAlertPage() {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);

  if (!PLAN_LIMITS[org.plan as Plan]?.alerts) {
    return (
      <div className="px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">New alert rule</h1>
        </div>
        <div className="bg-white rounded-2xl border border-amber-200 p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Bell size={28} className="text-amber-500" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Alerts are a Pro feature</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            Get notified in Slack, email, or webhooks when violations match your rules.
          </p>
          <UpgradeModal
            label="Upgrade to Pro"
            className="inline-flex h-9 items-center rounded-xl bg-green-600 text-white px-5 text-sm font-medium hover:bg-green-700 transition-colors"
          />
        </div>
      </div>
    );
  }

  const db = getDb();
  const projects = await db
    .select({ id: project.id, name: project.name })
    .from(project)
    .where(eq(project.orgId, org.id));

  return (
    <div className="px-8 py-8 space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/alerts" className="text-slate-400 hover:text-slate-700 text-sm transition-colors">
          ← Alerts
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-2xl font-semibold text-slate-900">New rule</h1>
      </div>
      <NewAlertForm projects={projects} />
    </div>
  );
}
