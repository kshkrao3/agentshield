"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import { CheckoutButton } from "@/app/pricing/checkout-button";

interface Props {
  /** Button label — defaults to "Upgrade" */
  label?: string;
  /** Extra classes on the trigger button */
  className?: string;
}

export function UpgradeModal({ label = "Upgrade to Pro", className = "" }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className || "inline-flex h-9 items-center rounded-xl bg-green-600 text-white px-5 text-sm font-medium hover:bg-green-700 transition-colors"}
      >
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-8 pb-6 text-center border-b border-slate-100">
              <button
                onClick={() => setOpen(false)}
                className="absolute right-5 top-5 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
              <h2 className="text-2xl font-semibold text-slate-900">Upgrade your plan</h2>
              <p className="text-slate-500 text-sm mt-1">Start free. Scale as you grow.</p>
            </div>

            {/* Cards */}
            <div className="px-8 py-8 grid grid-cols-1 sm:grid-cols-3 gap-5 items-stretch">
              <PricingCard
                name="Free"
                price={0}
                description="Prototyping & small projects"
                features={["10K events/month", "7-day retention", "1 project"]}
                cta={
                  <button
                    onClick={() => setOpen(false)}
                    className="w-full h-10 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Current plan
                  </button>
                }
              />
              <PricingCard
                name="Pro"
                price={29}
                description="Production agents"
                highlighted
                features={["1M events/month", "90-day retention", "3 projects", "Slack/email/webhook alerts", "Email support"]}
                cta={
                  <CheckoutButton
                    plan="pro"
                    className="block w-full h-10 rounded-xl bg-green-400 text-black text-sm font-semibold hover:bg-green-300 disabled:opacity-50 transition-colors"
                  />
                }
              />
              <PricingCard
                name="Team"
                price={99}
                description="Teams & multiple agents"
                features={["10M events/month", "30-day retention", "Unlimited projects", "RBAC + team members", "Priority support"]}
                cta={
                  <CheckoutButton
                    plan="team"
                    className="block w-full h-10 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  />
                }
              />
            </div>

            {/* Enterprise footer */}
            <div className="px-8 pb-8">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Enterprise</p>
                  <p className="text-xs text-slate-500 mt-0.5">Custom limits, on-prem, SSO, SOC2</p>
                </div>
                <a
                  href="mailto:kshkrao3@gmail.com"
                  className="text-sm font-medium text-green-700 hover:underline"
                >
                  Contact sales →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PricingCard({
  name, price, description, features, cta, highlighted,
}: {
  name: string;
  price: number;
  description: string;
  features: string[];
  cta: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div className={`relative rounded-2xl flex flex-col h-full ${
      highlighted
        ? "bg-[#0a0f1a] text-white ring-2 ring-green-400/50 p-6 mt-0"
        : "border border-slate-100 p-5 mt-4"
    }`}>
      {highlighted && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] uppercase font-bold tracking-widest bg-green-400 text-black px-3 py-1 rounded-full">
          Most popular
        </span>
      )}
      <div className="mb-4">
        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${highlighted ? "text-green-400" : "text-slate-400"}`}>
          {name}
        </p>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold ${highlighted ? "text-white" : "text-slate-900"}`}>
            ${price}
          </span>
          <span className="text-sm text-slate-400">/mo</span>
        </div>
        <p className={`text-xs mt-1 ${highlighted ? "text-slate-400" : "text-slate-500"}`}>{description}</p>
      </div>

      <ul className="space-y-2.5 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs">
            <Check size={13} className={`mt-0.5 flex-shrink-0 ${highlighted ? "text-green-400" : "text-green-600"}`} />
            <span className={highlighted ? "text-slate-300" : "text-slate-600"}>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5">{cta}</div>
    </div>
  );
}
