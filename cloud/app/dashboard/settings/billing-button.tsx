"use client";

import { useState } from "react";

export function ManageBillingButton({
  plan,
  hasSubscription,
}: {
  plan: string;
  hasSubscription: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    if (hasSubscription) {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      if (res.ok) {
        const { url } = (await res.json()) as { url: string };
        window.location.href = url;
      }
    } else {
      window.location.href = "/pricing";
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-accent disabled:opacity-50"
    >
      {loading ? "Loading..." : hasSubscription ? "Manage billing" : plan === "free" ? "Upgrade" : "Change plan"}
    </button>
  );
}
