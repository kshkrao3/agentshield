export type ViolationMode = "warn" | "block" | "quarantine";
export type Sensitivity = "low" | "medium" | "high";

export interface Policy {
  toolAllowlist?: string[];
  toolDenylist?: string[];
  memoryTTL?: number; // seconds; 0 = no expiry
  injectionSensitivity?: Sensitivity;
  onViolation?: ViolationMode;
  maxToolCallsPerTurn?: number;
  maxMemoryEntries?: number;
}

export const defaultPolicy = (): Required<Policy> => ({
  toolAllowlist: undefined as unknown as string[],
  toolDenylist: [],
  memoryTTL: 3600,
  injectionSensitivity: "medium",
  onViolation: "warn",
  maxToolCallsPerTurn: 20,
  maxMemoryEntries: 1000,
});
