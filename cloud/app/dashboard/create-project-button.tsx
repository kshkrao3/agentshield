"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
import { PLAN_LIMITS, Plan } from "@/lib/plans";
import { Plus, X } from "lucide-react";

export function CreateProjectButton({ orgPlan }: { orgPlan: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState<"dev" | "staging" | "prod">("prod");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, slug: slugify(name), environment }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Failed to create project");
      return;
    }
    const { id } = (await res.json()) as { id: string };
    setOpen(false);
    setName("");
    router.push(`/dashboard/projects/${id}`);
    router.refresh();
  }

  const limits = PLAN_LIMITS[orgPlan as Plan] ?? PLAN_LIMITS.free;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
      >
        <Plus size={15} />
        New project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-7 pt-7 pb-5 border-b border-slate-100">
              <button
                onClick={() => setOpen(false)}
                className="absolute right-5 top-5 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={17} />
              </button>
              <h2 className="text-lg font-semibold text-slate-900">New project</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {limits.maxProjects === Infinity ? "Unlimited projects on your plan." : `${limits.maxProjects} projects allowed on your plan.`}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Project name</label>
                <input
                  type="text"
                  placeholder="e.g. Customer Support Agent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400"
                  required
                  autoFocus
                />
                {name && (
                  <p className="text-xs text-slate-400 font-mono">slug: {slugify(name)}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Environment</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["dev", "staging", "prod"] as const).map((env) => (
                    <button
                      key={env}
                      type="button"
                      onClick={() => setEnvironment(env)}
                      className={`h-9 rounded-xl text-sm font-medium transition-colors ${
                        environment === env
                          ? env === "prod"
                            ? "bg-green-600 text-white"
                            : env === "staging"
                            ? "bg-amber-500 text-white"
                            : "bg-slate-700 text-white"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {env === "prod" ? "Production" : env === "staging" ? "Staging" : "Dev"}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-10 px-5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name}
                  className="h-10 px-5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Creating…" : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
