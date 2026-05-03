import { randomUUID } from "crypto";
import { AuditEmitter, ViolationEvent } from "./audit.js";
import { PromptFirewall } from "./firewall.js";
import { MemoryGuard } from "./memory-guard.js";
import { Policy, defaultPolicy } from "./policy.js";
import { Reporter, ReporterOptions } from "./reporter.js";
import { ToolSentinel } from "./sentinel.js";

export class ShieldViolationError extends Error {}

export class Shield {
  readonly emitter: AuditEmitter;
  readonly firewall: PromptFirewall;
  readonly sentinel: ToolSentinel;
  readonly memory: MemoryGuard;
  readonly reporter: Reporter | null;
  private resolvedPolicy: Required<Policy>;
  private sessionId: string;

  constructor(options: {
    policy?: Policy;
    audit?: Record<string, unknown>;
    sessionId?: string;
    reporter?: ReporterOptions | Reporter;
  } = {}) {
    this.resolvedPolicy = { ...defaultPolicy(), ...options.policy };
    this.sessionId = options.sessionId ?? randomUUID();
    this.emitter = new AuditEmitter(options.audit ?? {});
    this.firewall = new PromptFirewall(this.resolvedPolicy, this.emitter, this.sessionId);
    this.sentinel = new ToolSentinel(this.resolvedPolicy, this.emitter, this.sessionId);
    this.memory = new MemoryGuard(this.resolvedPolicy, this.emitter, this.sessionId);

    if (options.reporter) {
      this.reporter = options.reporter instanceof Reporter
        ? options.reporter
        : new Reporter(options.reporter);
      this.emitter.onViolation(this.reporter.handler);
    } else {
      this.reporter = null;
    }
  }

  onViolation(handler: (event: ViolationEvent) => void) {
    this.emitter.onViolation(handler);
  }

  inspectInput(userInput: string): string {
    const safe = this.firewall.inspect(userInput);
    if (!safe && this.resolvedPolicy.onViolation === "block") {
      throw new ShieldViolationError(`Input blocked by prompt firewall: ${userInput.slice(0, 100)}`);
    }
    return userInput;
  }

  checkTool(toolName: string, toolInput?: Record<string, unknown>): boolean {
    const allowed = this.sentinel.checkToolCall(toolName, toolInput);
    if (!allowed && this.resolvedPolicy.onViolation === "block") {
      throw new ShieldViolationError(`Tool '${toolName}' blocked by sentinel`);
    }
    return allowed;
  }

  wrap<T extends { invoke?: (...args: unknown[]) => unknown }>(agent: T): T & { shield: Shield } {
    const shield = this;
    const proxy = new Proxy(agent, {
      get(target, prop) {
        if (prop === "shield") return shield;
        const original = (target as Record<string | symbol, unknown>)[prop];
        if (prop === "invoke" && typeof original === "function") {
          return function (inputs: Record<string, unknown>, ...rest: unknown[]) {
            const userInput = inputs["input"] ?? inputs["query"] ?? inputs["message"];
            if (typeof userInput === "string") shield.inspectInput(userInput);
            shield.sentinel.resetTurn();
            return (original as Function).call(target, inputs, ...rest);
          };
        }
        return original;
      },
    });
    return proxy as T & { shield: Shield };
  }
}

export function shield<T extends object>(
  agent: T,
  options?: { policy?: Policy; reporter?: ReporterOptions | Reporter },
): T & { shield: Shield } {
  return new Shield(options).wrap(agent as T & { invoke?: () => unknown });
}
