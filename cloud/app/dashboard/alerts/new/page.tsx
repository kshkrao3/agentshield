import { requireUser, requireActiveOrg } from "@/lib/session";
import { getDb } from "@/lib/db";
import { project } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { PLAN_LIMITS, Plan } from "@/lib/plans";
import Link from "next/link";
import { NewAlertForm } from "./form";

export default async function NewAlertPage() {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);

  if (!PLAN_LIMITS[org.plan as Plan]?.alerts) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">New alert rule</h1>
        <div className="rounded-lg border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-6 text-center">
          <p className="font-medium mb-2">Alerts are a Pro feature.</p>
          <Link href="/pricing" className="inline-flex h-9 items-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium">
            Upgrade to Pro
          </Link>
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
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/alerts" className="text-muted-foreground hover:text-foreground text-sm">
          ← Alerts
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-2xl font-semibold">New rule</h1>
      </div>
      <NewAlertForm projects={projects} />
    </div>
  );
}
