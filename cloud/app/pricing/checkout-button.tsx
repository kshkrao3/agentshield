"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function CheckoutButton({ plan }: { plan: "pro" | "team" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const session = await authClient.getSession();
    if (!session.data) {
      router.push(`/sign-up?next=/pricing&plan=${plan}`);
      return;
    }
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const { url } = (await res.json()) as { url: string };
    window.location.href = url;
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="block w-full h-10 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
    >
      {loading ? "Loading..." : "Upgrade"}
    </button>
  );
}
