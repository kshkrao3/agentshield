"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { CheckCircle, X, Zap } from "lucide-react";

export function CheckoutSuccess({ plan }: { plan: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    // Clean ?checkout=success from the URL without a page reload
    const url = new URL(window.location.href);
    url.searchParams.delete("checkout");
    router.replace((url.pathname + (url.search || "")) as Route);
  }, [router]);

  if (!open) return null;

  const planLabel = plan === "pro" ? "Pro" : plan === "team" ? "Team" : plan;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Green top strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-green-400 to-emerald-500" />

        <div className="px-8 py-8 flex flex-col items-center text-center gap-4">
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
            <CheckCircle size={32} className="text-green-500" />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">You&apos;re on {planLabel}!</h2>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
              Your subscription is active. All {planLabel} features are unlocked — start using your expanded limits right away.
            </p>
          </div>

          <div className="w-full bg-green-50 border border-green-100 rounded-2xl px-4 py-3 flex items-center gap-3">
            <Zap size={15} className="text-green-600 flex-shrink-0" />
            <p className="text-xs text-green-800 text-left leading-relaxed">
              Your plan, limits, and billing details are updated below.
            </p>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="w-full h-10 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
