/**
 * Cloud reporter — buffers ViolationEvents and ships batches to AgentShield Cloud.
 *
 * Drop-in for shield(): pass `reporter: { apiKey: "ask_..." }` and every emitted
 * violation will be forwarded in addition to local handlers. Reporter never
 * throws; transport errors are swallowed so a network outage cannot crash the
 * host application.
 *
 * Works in Node 18+, Bun, Deno, browsers, edge runtimes (Cloudflare Workers,
 * Vercel Edge). The flush thread is replaced by setInterval; on Workers the
 * flush is implicit (small batch_size + ctx.waitUntil() not used here because
 * we don't have access to it — rely on next event triggering a synchronous
 * flush).
 */
import type { Severity, ViolationEvent, ViolationType } from "./audit";

const DEFAULT_ENDPOINT = "https://ingest.agentshield.dev/v1/events";
const SDK_VERSION = "0.2.0";

const TYPE_MAP: Record<ViolationType, "injection" | "tool" | "memory"> = {
  injection: "injection",
  tool_misuse: "tool",
  privilege_escalation: "tool",
  memory_poison: "memory",
};

const SEVERITY_MAP: Record<Severity, "low" | "medium" | "high"> = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "high",
};

interface CloudEvent {
  type: "injection" | "tool" | "memory";
  severity: "low" | "medium" | "high";
  message?: string;
  session_id?: string;
  metadata?: Record<string, unknown>;
  occurred_at?: string;
}

export interface ReporterOptions {
  apiKey: string;
  endpoint?: string;
  batchSize?: number;
  flushIntervalMs?: number;
  maxBuffer?: number;
  requestTimeoutMs?: number;
  maxRetries?: number;
}

export class Reporter {
  private buf: CloudEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private opts: Required<ReporterOptions>;

  constructor(options: ReporterOptions) {
    if (!options.apiKey || !options.apiKey.startsWith("ask_")) {
      throw new Error("apiKey must be a valid AgentShield key starting with 'ask_'");
    }
    this.opts = {
      apiKey: options.apiKey,
      endpoint: options.endpoint ?? DEFAULT_ENDPOINT,
      batchSize: options.batchSize ?? 50,
      flushIntervalMs: options.flushIntervalMs ?? 5000,
      maxBuffer: options.maxBuffer ?? 5000,
      requestTimeoutMs: options.requestTimeoutMs ?? 5000,
      maxRetries: options.maxRetries ?? 3,
    };

    // Edge runtimes (Workers) don't support long-lived timers reliably.
    // We still set one but tolerate the case where it never fires.
    if (typeof setInterval !== "undefined") {
      this.flushTimer = setInterval(() => this.flushAsync(), this.opts.flushIntervalMs);
      // Allow Node to exit even if reporter is still alive.
      const t = this.flushTimer as unknown as { unref?: () => void };
      if (typeof t.unref === "function") t.unref();
    }
  }

  /** AuditEmitter handler — call this from `shield.onViolation`. */
  handler = (event: ViolationEvent): void => {
    this.report(event);
  };

  report(event: ViolationEvent): void {
    if (this.buf.length >= this.opts.maxBuffer) this.buf.shift();
    this.buf.push(this.serialize(event));
    if (this.buf.length >= this.opts.batchSize) {
      this.flushAsync();
    }
  }

  /** Block until current buffer is sent (or fails permanently). */
  async flush(): Promise<void> {
    const batch = this.buf.splice(0, this.buf.length);
    if (batch.length === 0) return;
    await this.send(batch);
  }

  shutdown(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    void this.flush();
  }

  private serialize(event: ViolationEvent): CloudEvent {
    return {
      type: TYPE_MAP[event.type] ?? "injection",
      severity: SEVERITY_MAP[event.severity] ?? "medium",
      message: event.detail,
      session_id: event.sessionId,
      metadata: event.metadata,
      occurred_at: new Date(event.timestamp).toISOString(),
    };
  }

  private flushAsync(): void {
    if (this.buf.length === 0) return;
    const batch = this.buf.splice(0, this.opts.batchSize);
    void this.send(batch);
  }

  private async send(events: CloudEvent[]): Promise<void> {
    if (events.length === 0) return;
    const body = JSON.stringify({
      sdk_language: "typescript",
      sdk_version: SDK_VERSION,
      events,
    });
    let backoff = 500;
    for (let attempt = 0; attempt < this.opts.maxRetries; attempt++) {
      const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timeout = ctrl
        ? setTimeout(() => ctrl.abort(), this.opts.requestTimeoutMs)
        : null;
      try {
        const res = await fetch(this.opts.endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${this.opts.apiKey}`,
            "user-agent": `agentshield-typescript/${SDK_VERSION}`,
          },
          body,
          signal: ctrl?.signal,
        });
        if (timeout) clearTimeout(timeout);
        if (res.ok) return;
        if (res.status === 429 || res.status >= 500) {
          await sleep(backoff);
          backoff *= 2;
          continue;
        }
        return; // 4xx — drop, body was probably bad.
      } catch {
        if (timeout) clearTimeout(timeout);
        await sleep(backoff);
        backoff *= 2;
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
