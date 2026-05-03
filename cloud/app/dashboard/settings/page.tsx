import { requireUser, requireActiveOrg } from "@/lib/session";
import { PLAN_LIMITS, Plan } from "@/lib/plans";
import { ManageBillingButton } from "./billing-button";
import { formatDate } from "@/lib/utils";
import { CreditCard, User, Code } from "lucide-react";

export default async function SettingsPage() {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);
  const limits = PLAN_LIMITS[org.plan as Plan] ?? PLAN_LIMITS.free;

  return (
    <div className="px-8 py-8 space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">{org.name} &middot; <span className="font-mono">{org.slug}</span></p>
      </div>

      {/* Plan section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <CreditCard size={15} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">Plan & Billing</h2>
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xl font-semibold text-slate-900">{limits.prettyName}</div>
              <div className="text-sm text-slate-500 mt-0.5">
                {limits.monthlyEvents === Infinity
                  ? "Unlimited events"
                  : `${limits.monthlyEvents.toLocaleString()} events / mo`}
                {" · "}
                {limits.retentionDays} days retention
              </div>
            </div>
            {limits.monthlyPriceUsd !== null && (
              <div className="text-right">
                <div className="text-xl font-semibold text-slate-900">
                  ${limits.monthlyPriceUsd}
                  <span className="text-sm font-normal text-slate-400">/mo</span>
                </div>
              </div>
            )}
          </div>
          {org.subscriptionStatus && (
            <div className="text-xs text-slate-500 mb-4 bg-slate-50 rounded-lg px-3 py-2">
              Status: <strong className="text-slate-700">{org.subscriptionStatus}</strong>
              {org.currentPeriodEnd && (
                <span className="ml-2 text-slate-400">· Renews {formatDate(org.currentPeriodEnd)}</span>
              )}
            </div>
          )}
          <ManageBillingButton plan={org.plan} hasSubscription={!!org.lsSubscriptionId} />
        </div>
      </div>

      {/* Account section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <User size={15} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">Account</h2>
        </div>
        <div className="divide-y divide-slate-50">
          <Row label="Email" value={user.email} />
          <Row label="Name" value={user.name} />
          <Row label="User ID" value={user.id} mono />
          <Row label="Org ID" value={org.id} mono />
        </div>
      </div>

      {/* SDK quickstart */}
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

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-6 py-3.5 flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={mono ? "font-mono text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded" : "text-slate-800"}>
        {value}
      </span>
    </div>
  );
}
