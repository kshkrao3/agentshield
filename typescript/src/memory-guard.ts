import { AuditEmitter } from "./audit.js";
import { Policy } from "./policy.js";

interface MemoryEntry {
  value: unknown;
  createdAt: number;
  trusted: boolean;
}

export class MemoryGuard {
  private store = new Map<string, MemoryEntry>();

  constructor(
    private policy: Required<Policy>,
    private emitter: AuditEmitter,
    private sessionId?: string
  ) {}

  write(key: string, value: unknown, trusted = true): boolean {
    if (this.store.size >= this.policy.maxMemoryEntries) {
      this.emitter.emit("memory_poison", "medium", "Memory store at capacity — entry rejected", this.sessionId);
      return false;
    }

    if (!trusted) {
      this.emitter.emit("memory_poison", "high", `Untrusted memory write attempted for key '${key}'`, this.sessionId);
      if (this.policy.onViolation === "block") return false;
    }

    this.store.set(key, { value, createdAt: Date.now(), trusted });
    return true;
  }

  read(key: string): unknown {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (this.policy.memoryTTL > 0) {
      const ageSec = (Date.now() - entry.createdAt) / 1000;
      if (ageSec > this.policy.memoryTTL) {
        this.store.delete(key);
        return undefined;
      }
    }

    if (!entry.trusted) {
      this.emitter.emit("memory_poison", "high", `Read of untrusted memory entry '${key}' — quarantined`, this.sessionId);
      if (this.policy.onViolation === "block" || this.policy.onViolation === "quarantine") return undefined;
    }

    return entry.value;
  }

  markUntrusted(key: string) {
    const entry = this.store.get(key);
    if (entry) entry.trusted = false;
  }

  evictExpired() {
    if (this.policy.memoryTTL <= 0) return;
    const now = Date.now();
    for (const [k, e] of this.store) {
      if ((now - e.createdAt) / 1000 > this.policy.memoryTTL) this.store.delete(k);
    }
  }
}
