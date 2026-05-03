import { requireUser, requireActiveOrg } from "@/lib/session";
import { PLAN_LIMITS, Plan } from "@/lib/plans";
import { ManageBillingButton } from "./billing-button";
import { formatDate } from "@/lib/utils";

export default async function SettingsPage() {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);
  const limits = PLAN_LIMITS[org.plan as Plan] ?? PLAN_LIMITS.free;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm">{org.name} · {org.slug}</p>
      </div>

      <section>
        <h2 className="font-semibold mb-3">Plan</h2>
        <div className="rounded-lg border p-4">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="text-lg font-semibold">{limits.prettyName}</div>
              <div className="text-sm text-muted-foreground">
                {limits.monthlyEvents === Infinity
                  ? "Unlimited events"
                  : `${limits.monthlyEvents.toLocaleString()} events / mo`}
                {" · "}
                {limits.retentionDays} days retention
              </div>
            </div>
            <div className="text-right">
              {limits.monthlyPriceUsd !== null && (
                <div className="text-lg font-semibold">
                  ${limits.monthlyPriceUsd}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                </div>
              )}
            </div>
          </div>
          {org.subscriptionStatus && (
            <p className="text-xs text-muted-foreground mb-3">
              Status: <strong>{org.subscriptionStatus}</strong>
              {org.currentPeriodEnd && ` · Renews ${formatDate(org.currentPeriodEnd)}`}
            </p>
          )}
          <ManageBillingButton plan={org.plan} hasSubscription={!!org.lsSubscriptionId} />
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Account</h2>
        <div className="rounded-lg border divide-y">
          <Row label="Email" value={user.email} />
          <Row label="Name" value={user.name} />
          <Row label="User ID" value={user.id} mono />
          <Row label="Org ID" value={org.id} mono />
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">SDK quickstart</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Connect your AgentShield SDK to this dashboard:
        </p>
        <pre className="rounded-lg border bg-muted p-4 text-xs font-mono overflow-x-auto">
{`# Python
from agentshield import Shield, Reporter
shield = Shield(reporter=Reporter(api_key="ask_..."))

// TypeScript
import { shield } from "@apexguard/sdk";
const s = shield({ reporter: { apiKey: "ask_..." } });`}
        </pre>
      </section>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
    </div>
  );
}
