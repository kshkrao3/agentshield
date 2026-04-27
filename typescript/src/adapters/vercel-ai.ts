import { Shield } from "../shield.js";

/**
 * Wraps a Vercel AI SDK tool definition with ToolSentinel enforcement.
 * Compatible with the `tools` object passed to `generateText` / `streamText`.
 */
export function shieldTools(tools: Record<string, unknown>, shield: Shield): Record<string, unknown> {
  const wrapped: Record<string, unknown> = {};
  for (const [name, tool] of Object.entries(tools)) {
    const t = tool as Record<string, unknown>;
    wrapped[name] = {
      ...t,
      execute: async (...args: unknown[]) => {
        shield.checkTool(name, args[0] as Record<string, unknown>);
        const exec = t["execute"] as Function;
        return exec(...args);
      },
    };
  }
  return wrapped;
}
