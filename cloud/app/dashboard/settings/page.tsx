import { requireUser, requireActiveOrg } from "@/lib/session";
import { PLAN_LIMITS, Plan } from "@/lib/plans";
import { ManageBillingButton } from "./billing-button";
import { formatDate } from "@/lib/utils";
import { CreditCard, User, Code, Zap } from "lucide-react";

const planBadge: Record<string, string> = {
  free: "bg-slate-100 text-slate-600 border border-slate-200",
  pro: "bg-green-50 text-green-700 border border-green-200",
  team: "bg-blue-50 text-blue-700 border border-blue-200",
  enterprise: "bg-purple-50 text-purple-700 border border-purple-200",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);
  const limits = PLAN_LIMITS[org.plan as Plan] ?? PLAN_LIMITS.free;

  return (
    <div className="px-8 py-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {org.name} &middot; <span className="font-mono">{org.slug}</span>
        </p>
      </div>

      {/* 2-column: Plan & Billing + Account */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan & Billing */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <CreditCard size={15} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Plan & Billing</h2>
          </div>
          <div className="p-6 flex flex-col flex-1 gap-5">
            {/* Plan name + badge */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl font-semibold text-slate-900">{limits.prettyName}</span>
                  <span className={`text-[10px] uppercase font-semibold tracking-wide rounded-full px-2.5 py-0.5 ${planBadge[org.plan] ?? planBadge.free}`}>
                    {org.plan}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {limits.monthlyEvents === Infinity
                    ? "Unlimited events"
                    : `${limits.monthlyEvents.toLocaleString()} events / mo`}
                  {" · "}{limits.retentionDays}d retention
                </p>
              </div>
              {limits.monthlyPriceUsd !== null && (
                <div className="text-right flex-shrink-0">
                  <span className="text-2xl font-bold text-slate-900">${limits.monthlyPriceUsd}</span>
                  <span className="text-sm text-slate-400">/mo</span>
                </div>
              )}
            </div>

            {/* Quota pills */}
            <div className="grid grid-cols-3 gap-2">
              <StatPill
                label="Events/mo"
                value={limits.monthlyEvents === Infinity ? "∞" : limits.monthlyEvents.toLocaleString()}
              />
              <StatPill label="Retention" value={`${limits.retentionDays}d`} />
              <StatPill
                label="Projects"
                value={limits.maxProjects === Infinity ? "∞" : String(limits.maxProjects)}
              />
            </div>

            {/* Subscription status */}
            {org.subscriptionStatus && (
              <div className="flex items-center gap-2 text-xs bg-slate-50 rounded-xl px-4 py-2.5">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${org.subscriptionStatus === "active" ? "bg-green-500" : "bg-amber-400"}`} />
                <span className="text-slate-600">
                  Status: <strong className="text-slate-800">{org.subscriptionStatus}</strong>
                </span>
                {org.currentPeriodEnd && (
                  <span className="ml-auto text-slate-400">Renews {formatDate(org.currentPeriodEnd)}</span>
                )}
              </div>
            )}

            <div className="mt-auto">
              <ManageBillingButton plan={org.plan} hasSubscription={!!org.lsSubscriptionId} />
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <User size={15} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Account</h2>
          </div>
          <div className="divide-y divide-slate-50">
            <Row label="Name" value={user.name} />
            <Row label="Email" value={user.email} />
            <Row label="User ID" value={user.id} mono />
            <Row label="Org ID" value={org.id} mono />
          </div>
        </div>
      </div>

      {/* SDK quickstart — full width */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Code size={15} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">SDK Quickstart</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-4">
            Connect your AgentShield SDK to this dashboard:
          </p>
          <pre className="rounded-xl bg-[#0a0f1a] text-green-300 p-5 text-xs font-mono overflow-x-auto leading-relaxed">
{`# Python
from agentshield import Shield, Reporter
shield = Shield(reporter=Reporter(api_key="ask_..."))

// TypeScript
import { shield } from "@apexguard/sdk";
const s = shield({ reporter: { apiKey: "ask_..." } });`}
          </pre>
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-center">
      <div className="text-sm font-semibold text-slate-800">{value}</div>
      <div className="text-[10px] text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-6 py-3.5 flex items-center justify-between text-sm gap-4">
      <span className="text-slate-500 flex-shrink-0">{label}</span>
      <span className={mono ? "font-mono text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded truncate max-w-[16rem]" : "text-slate-800 text-right"}>
        {value}
      </span>
    </div>
  );
}
