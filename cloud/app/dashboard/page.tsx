import Link from "next/link";
import { requireUser, requireActiveOrg } from "@/lib/session";
import { getDb } from "@/lib/db";
import { project, event } from "@/drizzle/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { CreateProjectButton } from "./create-project-button";
import { formatRelativeTime } from "@/lib/utils";
import { PLAN_LIMITS, Plan } from "@/lib/plans";
import { Shield, Layers, Zap } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);
  const db = getDb();

  const projects = await db
    .select()
    .from(project)
    .where(eq(project.orgId, org.id))
    .orderBy(desc(project.createdAt));

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentCounts = await db
    .select({
      projectId: event.projectId,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(event)
    .innerJoin(project, eq(project.id, event.projectId))
    .where(and(eq(project.orgId, org.id), gte(event.occurredAt, since)))
    .groupBy(event.projectId);

  const countMap = new Map(recentCounts.map((c: { projectId: string; count: number }) => [c.projectId, c.count]));
  const totalEvents24h = recentCounts.reduce((acc, c) => acc + c.count, 0);
  const planLimits = PLAN_LIMITS[org.plan as Plan] ?? PLAN_LIMITS.free;

  // greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  function envColor(env: string) {
    if (env === "production") return "bg-green-500";
    if (env === "staging") return "bg-amber-400";
    return "bg-slate-400";
  }

  function envBadge(env: string) {
    if (env === "production")
      return "bg-green-50 text-green-700 border border-green-200";
    if (env === "staging")
      return "bg-amber-50 text-amber-700 border border-amber-200";
    return "bg-slate-100 text-slate-600 border border-slate-200";
  }

  return (
    <div className="px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {greeting}, <span className="text-green-600">{org.name}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Here&apos;s what&apos;s happening across your agent projects.
          </p>
        </div>
        <CreateProjectButton orgPlan={org.plan} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">{totalEvents24h.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-0.5">Events last 24h</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Layers size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">{projects.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Projects
              {planLimits.maxProjects !== Infinity && (
                <span className="text-slate-400"> / {planLimits.maxProjects}</span>
              )}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Shield size={18} className="text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900 capitalize">{planLimits.prettyName}</p>
            <p className="text-xs text-slate-500 mt-0.5">Current plan</p>
          </div>
        </div>
      </div>

      {/* Projects grid */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
            <Shield size={28} className="text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">No projects yet</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-xs">
            Each project gets its own API key and event stream.
          </p>
          <CreateProjectButton orgPlan={org.plan} />
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Projects</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/projects/${p.id}`}
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all overflow-hidden"
              >
                {/* Colored accent bar */}
                <div className={`h-1 w-full ${envColor(p.environment)}`} />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 group-hover:text-green-700 transition-colors">
                      {p.name}
                    </h3>
                    <span className={`text-[10px] uppercase font-semibold tracking-wide rounded-full px-2 py-0.5 ${envBadge(p.environment)}`}>
                      {p.environment}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mb-4 truncate">{p.slug}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-slate-900">
                      {(countMap.get(p.id) ?? 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400">events / 24h</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-3">
                    Created {formatRelativeTime(p.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
