"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  projects: { id: string; name: string }[];
  current: { type?: string; severity?: string; project?: string; range?: string };
}

export function EventFilters({ projects, current }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.push(`/dashboard/events?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <FilterSelect
        label="Range"
        value={current.range ?? "24h"}
        onChange={(v) => update("range", v)}
        options={[
          { value: "1h", label: "Last 1h" },
          { value: "24h", label: "Last 24h" },
          { value: "7d", label: "Last 7 days" },
          { value: "30d", label: "Last 30 days" },
        ]}
      />
      {projects.length > 1 && (
        <FilterSelect
          label="Project"
          value={current.project ?? ""}
          onChange={(v) => update("project", v)}
          options={[
            { value: "", label: "All projects" },
            ...projects.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />
      )}
      <FilterSelect
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
      <FilterSelect
        label="Severity"
        value={current.severity ?? ""}
        onChange={(v) => update("severity", v)}
        options={[
          { value: "", label: "All" },
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
        ]}
      />
    </div>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 pl-3 pr-7 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400 appearance-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
