export type ViolationType = "injection" | "tool_misuse" | "memory_poison" | "privilege_escalation";
export type Severity = "low" | "medium" | "high" | "critical";

export interface ViolationEvent {
  type: ViolationType;
  severity: Severity;
  detail: string;
  timestamp: number;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

type Handler = (event: ViolationEvent) => void;

export class AuditEmitter {
  private handlers: Handler[] = [];

  constructor(private config: Record<string, unknown> = {}) {
    if (config["mode"] !== "silent") {
      this.handlers.push((e) =>
        console.warn(`[agentshield] ${e.severity.toUpperCase()} ${e.type}: ${e.detail}`)
      );
    }
    if (config["webhook"]) {
      this.handlers.push(this.makeWebhookHandler(config["webhook"] as string));
    }
  }

  private makeWebhookHandler(url: string): Handler {
    return (event) => {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }).catch(() => {});
    };
  }

  onViolation(handler: Handler) {
    this.handlers.push(handler);
  }

  emit(type: ViolationType, severity: Severity, detail: string, sessionId?: string, metadata?: Record<string, unknown>) {
    const event: ViolationEvent = { type, severity, detail, timestamp: Date.now(), sessionId, metadata };
    for (const h of this.handlers) {
      try { h(event); } catch {}
    }
  }
}
