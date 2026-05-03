import Link from "next/link";
import { PLAN_LIMITS } from "@/lib/plans";
import { CheckoutButton } from "./checkout-button";
import { MarketingHeader } from "@/components/marketing-header";

export default function PricingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <MarketingHeader />

      <section className="flex-1 px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold tracking-tight">Simple pricing</h1>
            <p className="mt-3 text-muted-foreground">
              Start free. Upgrade when you need more.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <PricingCard
              name="Free"
              price={0}
              description="For prototyping and small projects"
              features={[
                `${PLAN_LIMITS.free.monthlyEvents.toLocaleString()} events/month`,
                `${PLAN_LIMITS.free.retentionDays}-day retention`,
                "1 project",
                "Community support",
              ]}
              cta={<Link href="/sign-up" className="block w-full h-10 rounded-md border text-center leading-10 font-medium hover:bg-accent transition-colors">Start free</Link>}
            />
            <PricingCard
              name="Pro"
              price={29}
              highlighted
              description="For production agents"
              features={[
                `${(PLAN_LIMITS.pro.monthlyEvents / 1_000_000).toFixed(0)}M events/month`,
                `${PLAN_LIMITS.pro.retentionDays}-day retention`,
                "3 projects",
                "Slack/email/webhook alerts",
                "Email support",
              ]}
              cta={<CheckoutButton plan="pro" />}
            />
            <PricingCard
              name="Team"
              price={99}
              description="For teams running multiple agents"
              features={[
                `${(PLAN_LIMITS.team.monthlyEvents / 1_000_000).toFixed(0)}M events/month`,
                `${PLAN_LIMITS.team.retentionDays}-day retention`,
                "Unlimited projects",
                "RBAC + team members",
                "All alert channels",
                "Priority support",
              ]}
              cta={<CheckoutButton plan="team" />}
            />
          </div>

          <div className="mt-16 rounded-lg border p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Enterprise</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto text-sm">
              Custom retention, on-prem deployment, SOC2 reports, SSO, dedicated support.
            </p>
            <Link
              href="mailto:kshkrao3@gmail.com"
              className="inline-flex h-10 items-center rounded-md border px-6 font-medium hover:bg-accent transition-colors"
            >
              Contact sales
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 px-6">
        <div className="max-w-6xl mx-auto text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} AgentShield</span>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="https://github.com/kshkrao3/agentshield" className="hover:text-foreground transition-colors">GitHub</Link>
            <Link href="https://kshkrao3.github.io/agentshield/" className="hover:text-foreground transition-colors">OSS docs</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function PricingCard({
  name,
  price,
  description,
  features,
  cta,
  highlighted,
}: {
  name: string;
  price: number;
  description: string;
  features: string[];
  cta: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-6 ${highlighted ? "border-foreground shadow-lg relative" : ""}`}>
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground text-xs px-3 py-1 font-medium">
          Most popular
        </div>
      )}
      <h3 className="text-lg font-semibold">{name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-4xl font-bold">${price}</span>
        <span className="text-muted-foreground">/mo</span>
      </div>
      <p className="text-sm text-muted-foreground mt-2 mb-6">{description}</p>
      <ul className="space-y-2 mb-6 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {cta}
    </div>
  );
}
