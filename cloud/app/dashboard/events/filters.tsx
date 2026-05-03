"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  projects: { id: string; name: string }[];
  current: {
    type?: string;
    severity?: string;
    project?: string;
    range?: string;
  };
}

export function EventFilters({ projects, current }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/dashboard/events?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        label="Range"
        value={current.range ?? "24h"}
        onChange={(v) => update("range", v)}
        options={[
          { value: "1h", label: "Last hour" },
          { value: "24h", label: "Last 24h" },
          { value: "7d", label: "Last 7 days" },
          { value: "30d", label: "Last 30 days" },
        ]}
      />
      <Select
        label="Project"
        value={current.project ?? ""}
        onChange={(v) => update("project", v)}
        options={[
          { value: "", label: "All projects" },
          ...projects.map((p) => ({ value: p.id, label: p.name })),
        ]}
      />
      <Select
        label="Type"
        value={current.type ?? ""}
        onChange={(v) => update("type", v)}
        options={[
          { value: "", label: "All types" },
          { value: "injection", label: "Injection" },
          { value: "tool", label: "Tool" },
          { value: "memory", label: "Memory" },
        ]}
      />
      <Select
        label="Severity"
        value={current.severity ?? ""}
        onChange={(v) => update("severity", v)}
        options={[
          { value: "", label: "All severities" },
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
        ]}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 px-2 rounded-md border bg-background"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
