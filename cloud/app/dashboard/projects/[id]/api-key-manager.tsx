"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

interface ApiKeySummary {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export function ApiKeyManager({
  projectId,
  keys,
}: {
  projectId: string;
  keys: ApiKeySummary[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [revealed, setRevealed] = useState<{ key: string; prefix: string } | null>(null);

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

  return (
    <div className="space-y-3">
      {revealed && (
        <div className="rounded-lg border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4">
          <p className="font-medium mb-2">Copy this key now — it won&apos;t be shown again.</p>
          <code className="block w-full p-2 rounded bg-background font-mono text-xs break-all">
            {revealed.key}
          </code>
          <button
            onClick={() => setRevealed(null)}
            className="mt-3 text-sm underline"
          >
            I&apos;ve saved it
          </button>
        </div>
      )}

      {keys.length === 0 ? (
        <p className="text-sm text-muted-foreground">No API keys yet.</p>
      ) : (
        <div className="rounded-lg border divide-y">
          {keys.map((k) => (
            <div key={k.id} className="px-4 py-3 flex items-center gap-4 text-sm">
              <div className="flex-1">
                <div className="font-medium">{k.name}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {k.prefix}…
                </div>
              </div>
              <div className="text-xs text-muted-foreground text-right">
                <div>Created {formatDate(k.createdAt)}</div>
                <div>{k.lastUsedAt ? `Last used ${formatDate(k.lastUsedAt)}` : "Never used"}</div>
              </div>
              <button
                onClick={() => handleRevoke(k.id)}
                className="text-sm text-destructive hover:underline"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          type="text"
          placeholder="Key name (e.g. production-server)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 h-9 px-3 rounded-md border bg-background text-sm"
          required
        />
        <button
          type="submit"
          disabled={creating || !name}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create key"}
        </button>
      </form>
    </div>
  );
}
