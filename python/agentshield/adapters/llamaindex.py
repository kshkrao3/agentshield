"""LlamaIndex adapter — wraps FunctionTool instances with ToolSentinel enforcement."""
from typing import Any

from ..shield import Shield


def shield_tools(tools: list, shield: Shield) -> list:
    """Wrap a list of LlamaIndex tools with ToolSentinel enforcement."""
    return [_ShieldedLlamaIndexTool(t, shield) for t in tools]


class _ShieldedLlamaIndexTool:
    def __init__(self, tool: Any, shield: Shield):
        self._tool = tool
        self._shield = shield
        self.metadata = tool.metadata

    def __call__(self, *args, **kwargs) -> Any:
        self._shield.check_tool(self.metadata.name, kwargs or {})
        return self._tool(*args, **kwargs)

    async def acall(self, *args, **kwargs) -> Any:
        self._shield.check_tool(self.metadata.name, kwargs or {})
        return await self._tool.acall(*args, **kwargs)

    def __getattr__(self, name: str) -> Any:
        return getattr(self._tool, name)
