"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Copy, Trash2, Check } from "lucide-react";

interface ApiKeySummary {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export function ApiKeyManager({ projectId, keys }: { projectId: string; keys: ApiKeySummary[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [revealed, setRevealed] = useState<{ key: string; prefix: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch(`/api/projects/${projectId}/keys`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setCreating(false);
    if (!res.ok) return;
    const data = (await res.json()) as { key: string; prefix: string };
    setRevealed({ key: data.key, prefix: data.prefix });
    setName("");
    router.refresh();
  }

  async function handleRevoke(keyId: string) {
    if (!confirm("Revoke this API key? Existing SDK clients using it will start failing.")) return;
    const res = await fetch(`/api/projects/${projectId}/keys/${keyId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  async function handleCopy() {
    if (!revealed) return;
    await navigator.clipboard.writeText(revealed.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {revealed && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">
            Copy this key now — it won&apos;t be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 font-mono text-xs text-amber-900 break-all">
              {revealed.key}
            </code>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 p-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-700 transition-colors"
              title="Copy"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
          <button onClick={() => setRevealed(null)} className="mt-3 text-xs text-amber-700 underline">
            I&apos;ve saved it
          </button>
        </div>
      )}

      {keys.length === 0 ? (
        <p className="text-sm text-slate-400 py-2">No API keys yet. Create one below.</p>
      ) : (
        <div className="rounded-xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
          {keys.map((k) => (
            <div key={k.id} className="px-4 py-3.5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{k.name}</p>
                <p className="text-xs font-mono text-slate-400 mt-0.5">{k.prefix}••••••••</p>
              </div>
              <div className="text-xs text-slate-400 text-right flex-shrink-0">
                <p>Created {formatDate(k.createdAt)}</p>
                <p>{k.lastUsedAt ? `Used ${formatDate(k.lastUsedAt)}` : "Never used"}</p>
              </div>
              <button
                onClick={() => handleRevoke(k.id)}
                className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Revoke key"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleCreate} className="flex gap-2 pt-1">
        <input
          type="text"
          placeholder="Key name (e.g. production-server)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400"
          required
        />
        <button
          type="submit"
          disabled={creating || !name}
          className="h-10 px-5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {creating ? "Creating…" : "Create key"}
        </button>
      </form>
    </div>
  );
}
