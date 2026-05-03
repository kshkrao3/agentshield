export type Plan = "free" | "pro" | "team" | "enterprise";

export const PLAN_LIMITS: Record<Plan, {
  monthlyEvents: number;
  retentionDays: number;
  maxProjects: number;
  alerts: boolean;
  rbac: boolean;
  prettyName: string;
  monthlyPriceUsd: number | null;
}> = {
  free: {
    monthlyEvents: 10_000,
    retentionDays: 7,
    maxProjects: 1,
    alerts: false,
    rbac: false,
    prettyName: "Free",
    monthlyPriceUsd: 0,
  },
  pro: {
    monthlyEvents: 1_000_000,
    retentionDays: 90,
    maxProjects: 3,
    alerts: true,
    rbac: false,
    prettyName: "Pro",
    monthlyPriceUsd: 29,
  },
  team: {
    monthlyEvents: 10_000_000,
    retentionDays: 30,
    maxProjects: Infinity,
    alerts: true,
    rbac: true,
    prettyName: "Team",
    monthlyPriceUsd: 99,
  },
  enterprise: {
    monthlyEvents: Infinity,
    retentionDays: 365,
    maxProjects: Infinity,
    alerts: true,
    rbac: true,
    prettyName: "Enterprise",
    monthlyPriceUsd: null,
  },
};
