import { AuditEmitter } from "./audit.js";
import { Policy } from "./policy.js";

export class ToolSentinel {
  private turnCallCount = 0;
  private callCounts = new Map<string, number>();

  constructor(
    private policy: Required<Policy>,
    private emitter: AuditEmitter,
    private sessionId?: string
  ) {}

  resetTurn() {
    this.turnCallCount = 0;
  }

  checkToolCall(toolName: string, toolInput?: Record<string, unknown>): boolean {
    if (this.policy.toolDenylist.includes(toolName)) {
      this.emitter.emit("tool_misuse", "critical", `Tool '${toolName}' is explicitly denied`, this.sessionId);
      return false;
    }

    if (this.policy.toolAllowlist && !this.policy.toolAllowlist.includes(toolName)) {
      this.emitter.emit("privilege_escalation", "high", `Tool '${toolName}' not in allowlist`, this.sessionId);
      return false;
    }

    this.turnCallCount++;
    if (this.turnCallCount > this.policy.maxToolCallsPerTurn) {
      this.emitter.emit("tool_misuse", "medium", `Tool call limit (${this.policy.maxToolCallsPerTurn}/turn) exceeded`, this.sessionId);
      return false;
    }

    this.callCounts.set(toolName, (this.callCounts.get(toolName) ?? 0) + 1);
    return true;
  }
}
