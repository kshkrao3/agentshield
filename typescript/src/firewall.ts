import { AuditEmitter } from "./audit.js";
import { Policy, defaultPolicy } from "./policy.js";

const LOW_PATTERNS = [
  /ignore\s+(previous|all|above|prior)\s+(instructions?|prompts?|rules?|context)/i,
  /disregard\s+(your\s+)?(previous|all|above|prior)\s+(instructions?|prompts?|rules?)/i,
  /forget\s+(everything|all|your\s+instructions)/i,
  /you\s+are\s+now\s+(a|an)\s+\w+/i,
  /act\s+as\s+(if\s+you\s+are|a|an)\s+/i,
  /new\s+system\s+prompt/i,
  /system:\s*(you|ignore|forget)/i,
];

const MEDIUM_PATTERNS = [
  ...LOW_PATTERNS,
  /override\s+(your\s+)?(instructions?|rules?|guidelines?|behavior)/i,
  /your\s+(true|real|actual)\s+(purpose|goal|mission|task)/i,
  /developer\s+mode/i,
  /jailbreak/i,
  /do\s+anything\s+now/i,
  /dan\s+mode/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /simulate\s+(being|a|an)/i,
  /<\s*\/?system\s*>/i,
  /\[system\]/i,
  /\{\{.*\}\}/,
];

const HIGH_PATTERNS = [
  ...MEDIUM_PATTERNS,
  /repeat\s+(after\s+me|the\s+following)/i,
  /what\s+(are|were)\s+your\s+(instructions?|system\s+prompt)/i,
  /print\s+(your\s+)?(instructions?|system\s+prompt|prompt)/i,
  /reveal\s+(your\s+)?(instructions?|system\s+prompt|context)/i,
  /show\s+(me\s+)?(your\s+)?(instructions?|system\s+prompt)/i,
  /prompt\s+leak/i,
];

const PATTERN_MAP = { low: LOW_PATTERNS, medium: MEDIUM_PATTERNS, high: HIGH_PATTERNS };

export class PromptFirewall {
  private patterns: RegExp[];

  constructor(
    private policy: Required<Policy>,
    private emitter: AuditEmitter,
    private sessionId?: string
  ) {
    this.patterns = PATTERN_MAP[policy.injectionSensitivity];
  }

  inspect(userInput: string): boolean {
    for (const pattern of this.patterns) {
      if (pattern.test(userInput)) {
        this.emitter.emit("injection", "high", `Prompt injection pattern matched: ${pattern.source.slice(0, 60)}`, this.sessionId, {
          snippet: userInput.slice(0, 200),
        });
        return false;
      }
    }
    return true;
  }

  inspectRagChunk(chunk: string): boolean {
    return this.inspect(chunk);
  }
}
