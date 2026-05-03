"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
import { PLAN_LIMITS, Plan } from "@/lib/plans";

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
    router.push(`/dashboard/projects/${id}`);
    router.refresh();
  }

  const limits = PLAN_LIMITS[orgPlan as Plan] ?? PLAN_LIMITS.free;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:opacity-90"
      >
        New project
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6">
          <div className="bg-background rounded-lg border w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-1">New project</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Plan limit: {limits.maxProjects === Infinity ? "unlimited" : limits.maxProjects} projects.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-md border bg-background"
                required
              />
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as "dev" | "staging" | "prod")}
                className="w-full h-10 px-3 rounded-md border bg-background"
              >
                <option value="dev">Development</option>
                <option value="staging">Staging</option>
                <option value="prod">Production</option>
              </select>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-9 px-4 rounded-md border text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
