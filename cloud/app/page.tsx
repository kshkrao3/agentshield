import Link from "next/link";
import { MarketingHeader } from "@/components/marketing-header";
import { ShieldAnimation } from "@/components/shield-animation";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative flex-1 flex items-center px-6 py-24 overflow-hidden">
        <ShieldAnimation />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs text-muted-foreground mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Open-source core · Cloud-managed patterns
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
            Runtime security for<br className="hidden sm:block" /> your LLM agents
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Centralized violation logs, managed attack patterns, and real-time alerts —
            built on the open-source AgentShield SDK.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-md bg-primary text-primary-foreground px-8 font-medium hover:opacity-90 transition-opacity"
            >
              Start free
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-md border px-8 font-medium hover:bg-accent transition-colors"
            >
              View pricing
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">Free tier: 10K events/month — no credit card required.</p>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-y py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
          <div>
            <div className="text-3xl font-bold text-green-500">10K</div>
            <div className="mt-1 font-medium">events/month free</div>
            <div className="mt-1 text-sm text-muted-foreground">No credit card required</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-500">&lt;5ms</div>
            <div className="mt-1 font-medium">SDK overhead</div>
            <div className="mt-1 text-sm text-muted-foreground">Zero blocking on the hot path</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-500">Edge</div>
            <div className="mt-1 font-medium">global ingest</div>
            <div className="mt-1 text-sm text-muted-foreground">Cloudflare Workers worldwide</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-14">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Wrap your agent", body: "Add the SDK to your LangChain, LlamaIndex, or custom agent in minutes. Python and TypeScript." },
              { step: "02", title: "Events stream in", body: "Every policy violation — injection attempt, tool misuse, PII leak — is sent to AgentShield Cloud in real-time." },
              { step: "03", title: "Alert and analyze", body: "Receive Slack, email, or webhook alerts. Explore trends and tune your policy in the dashboard." },
            ].map(({ step, title, body }) => (
              <div key={step} className="rounded-lg border p-6">
                <div className="text-xs font-mono text-green-500 mb-3">{step}</div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t py-20 px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to secure your agents?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto text-sm sm:text-base">
          Join developers already protecting production agents from prompt injection, tool misuse, and data leaks.
        </p>
        <Link
          href="/sign-up"
          className="inline-flex h-11 items-center rounded-md bg-primary text-primary-foreground px-8 font-medium hover:opacity-90 transition-opacity"
        >
          Get started free
        </Link>
      </section>

      <footer className="border-t py-8 px-6">
        <div className="max-w-6xl mx-auto text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} AgentShield</span>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="https://github.com/kshkrao3/agentshield" className="hover:text-foreground transition-colors">GitHub</Link>
            <Link href="https://kshkrao3.github.io/agentshield/" className="hover:text-foreground transition-colors">OSS docs</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
