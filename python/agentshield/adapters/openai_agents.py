"""OpenAI Agents SDK adapter — wraps FunctionTool with ToolSentinel + PromptFirewall."""
from typing import Any, Callable, Optional

from ..shield import Shield, ShieldViolationError


def shield_tools(tools: list, shield: Shield) -> list:
    """Wrap a list of openai-agents FunctionTool objects with Shield enforcement."""
    return [_ShieldedFunctionTool(t, shield) for t in tools]


def shield_agent_input(user_input: str, shield: Shield) -> str:
    """Inspect a user message before passing it to an OpenAI agent. Raises on violation."""
    shield.inspect_input(user_input)
    return user_input


class _ShieldedFunctionTool:
    """
    Wraps an openai-agents FunctionTool, intercepting on_invoke_tool so the
    ToolSentinel runs before every execution.

    Compatible with openai-agents >= 0.0.3 (FunctionTool.on_invoke_tool interface).
    """

    def __init__(self, tool: Any, shield: Shield):
        self._tool = tool
        self._shield = shield

    @property
    def name(self) -> str:
        return self._tool.name

    @property
    def description(self) -> str:
        return getattr(self._tool, "description", "")

    @property
    def params_json_schema(self) -> dict:
        return getattr(self._tool, "params_json_schema", {})

    async def on_invoke_tool(self, ctx: Any, input: str) -> str:
        allowed = self._shield.check_tool(self.name)
        if not allowed:
            raise ShieldViolationError(f"Tool '{self.name}' blocked by AgentShield sentinel")
        return await self._tool.on_invoke_tool(ctx, input)

    def __getattr__(self, name: str) -> Any:
        return getattr(self._tool, name)
