"""LangChain adapter — wraps tools so sentinel is invoked before execution."""
from typing import Any, Optional

from ..shield import Shield


def shield_tools(tools: list, shield: Shield) -> list:
    """Wrap a list of LangChain tools with ToolSentinel enforcement."""
    wrapped = []
    for tool in tools:
        wrapped.append(_ShieldedTool(tool, shield))
    return wrapped


class _ShieldedTool:
    def __init__(self, tool: Any, shield: Shield):
        self._tool = tool
        self._shield = shield
        # Mirror LangChain tool interface
        self.name = tool.name
        self.description = tool.description

    def __call__(self, *args, **kwargs) -> Any:
        self._shield.check_tool(self.name, kwargs or {})
        return self._tool(*args, **kwargs)

    def run(self, tool_input: Any, **kwargs) -> Any:
        self._shield.check_tool(self.name, tool_input if isinstance(tool_input, dict) else {})
        return self._tool.run(tool_input, **kwargs)

    async def arun(self, tool_input: Any, **kwargs) -> Any:
        self._shield.check_tool(self.name, tool_input if isinstance(tool_input, dict) else {})
        return await self._tool.arun(tool_input, **kwargs)

    def __getattr__(self, name: str) -> Any:
        return getattr(self._tool, name)
