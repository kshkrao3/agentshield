"use client";

import { useState } from "react";
import { UpgradeModal } from "@/components/upgrade-modal";

export function ManageBillingButton({
  plan,
  hasSubscription,
}: {
  plan: string;
  hasSubscription: boolean;
}) {
  const [loading, setLoading] = useState(false);

  if (!hasSubscription) {
    return (
      <UpgradeModal
        label={plan === "free" ? "Upgrade plan" : "Change plan"}
        className="inline-flex h-9 items-center rounded-xl bg-green-600 text-white px-5 text-sm font-medium hover:bg-green-700 transition-colors"
      />
    );
  }

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    if (res.ok) {
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex h-9 items-center rounded-xl border border-slate-200 px-5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
    >
      {loading ? "Loading..." : "Manage billing"}
    </button>
  );
}
