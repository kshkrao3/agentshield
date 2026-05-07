"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Project { id: string; name: string }

const INPUT = "w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400";

export function NewAlertForm({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [channelType, setChannelType] = useState("slack");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = {
      projectId: fd.get("projectId"),
      name: fd.get("name"),
      filterType: fd.get("filterType"),
      filterMinSeverity: fd.get("filterMinSeverity"),
      channelType: fd.get("channelType"),
      channelTarget: fd.get("channelTarget"),
    };
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      router.push("/dashboard/alerts");
      router.refresh();
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Something went wrong.");
      setSaving(false);
    }
  }

  const channelPlaceholder: Record<string, string> = {
    slack: "https://hooks.slack.com/services/...",
    email: "you@example.com",
    webhook: "https://your-endpoint.com/hook",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Rule name">
          <input name="name" required placeholder="High-severity injections" className={INPUT} />
        </Field>

        <Field label="Project">
          <select name="projectId" required className={INPUT}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Event type">
            <select name="filterType" className={INPUT}>
              <option value="any">Any</option>
              <option value="injection">Injection</option>
              <option value="tool">Tool misuse</option>
              <option value="memory">Memory poison</option>
            </select>
          </Field>
          <Field label="Min severity">
            <select name="filterMinSeverity" className={INPUT}>
              <option value="low">Low+</option>
              <option value="medium">Medium+</option>
              <option value="high">High only</option>
            </select>
          </Field>
        </div>

        <Field label="Notification channel">
          <select
            name="channelType"
            value={channelType}
            onChange={(e) => setChannelType(e.target.value)}
            className={INPUT}
          >
            <option value="slack">Slack webhook</option>
            <option value="email">Email</option>
            <option value="webhook">Webhook</option>
          </select>
        </Field>

        <Field label={channelType === "email" ? "Email address" : channelType === "slack" ? "Slack webhook URL" : "Webhook URL"}>
          <input
            name="channelTarget"
            required
            type={channelType === "email" ? "email" : "url"}
            placeholder={channelPlaceholder[channelType]}
            className={INPUT}
          />
        </Field>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-6 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Create rule"}
          </button>
          <a
            href="/dashboard/alerts"
            className="h-10 px-6 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors inline-flex items-center"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
