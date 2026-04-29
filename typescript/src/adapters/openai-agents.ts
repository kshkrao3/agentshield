import { Shield, ShieldViolationError } from "../shield.js";

/**
 * Wraps an array of OpenAI Agents SDK tool definitions with Shield enforcement.
 * Compatible with the `tools` array passed to `new Agent({ tools })`.
 */
export function shieldTools(tools: OpenAIAgentTool[], shield: Shield): OpenAIAgentTool[] {
  return tools.map((tool) => shieldTool(tool, shield));
}

/**
 * Inspect a user message before it reaches an OpenAI agent. Throws on violation.
 */
export function shieldAgentInput(userInput: string, shield: Shield): string {
  shield.inspectInput(userInput);
  return userInput;
}

function shieldTool(tool: OpenAIAgentTool, shield: Shield): OpenAIAgentTool {
  return {
    ...tool,
    execute: async (...args: unknown[]) => {
      const allowed = shield.checkTool(tool.name, args[0] as Record<string, unknown>);
      if (!allowed) {
        throw new ShieldViolationError(`Tool '${tool.name}' blocked by AgentShield sentinel`);
      }
      return tool.execute(...args);
    },
  };
}

export interface OpenAIAgentTool {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
  execute: (...args: unknown[]) => Promise<unknown>;
}
