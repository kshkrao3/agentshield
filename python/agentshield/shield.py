import uuid
from typing import Any, Callable, Optional

from .audit import AuditEmitter, ViolationEvent
from .firewall import PromptFirewall
from .memory_guard import MemoryGuard
from .policy import Policy
from .reporter import Reporter
from .sentinel import ToolSentinel


class ShieldViolationError(Exception):
    pass


class Shield:
    def __init__(
        self,
        policy: Optional[Policy] = None,
        audit: Optional[dict] = None,
        session_id: Optional[str] = None,
        reporter: Optional[Reporter] = None,
    ):
        self._policy = policy or Policy()
        self._session_id = session_id or str(uuid.uuid4())
        self._emitter = AuditEmitter(config=audit or {})
        self._firewall = PromptFirewall(self._policy, self._emitter, self._session_id)
        self._sentinel = ToolSentinel(self._policy, self._emitter, self._session_id)
        self._memory = MemoryGuard(self._policy, self._emitter, self._session_id)
        if reporter is not None:
            self._emitter.on_violation(reporter)
        self._reporter = reporter

    @property
    def memory(self) -> MemoryGuard:
        return self._memory

    @property
    def firewall(self) -> PromptFirewall:
        return self._firewall

    @property
    def sentinel(self) -> ToolSentinel:
        return self._sentinel

    def on_violation(self, handler: Callable[[ViolationEvent], None]):
        self._emitter.on_violation(handler)

    def inspect_input(self, user_input: str) -> str:
        """Inspect user input through the prompt firewall. Returns safe input or raises."""
        safe = self._firewall.inspect(user_input)
        if not safe and self._policy.on_violation == "block":
            raise ShieldViolationError(f"Input blocked by prompt firewall: {user_input[:100]}")
        return user_input

    def check_tool(self, tool_name: str, tool_input: Optional[dict] = None) -> bool:
        allowed = self._sentinel.check_tool_call(tool_name, tool_input)
        if not allowed and self._policy.on_violation == "block":
            raise ShieldViolationError(f"Tool '{tool_name}' blocked by sentinel")
        return allowed

    def wrap(self, agent: Any) -> "ShieldedAgent":
        return ShieldedAgent(agent=agent, shield=self)


class ShieldedAgent:
    """Thin wrapper that intercepts invoke/run calls to apply shield checks."""

    def __init__(self, agent: Any, shield: Shield):
        self._agent = agent
        self._shield = shield

    def invoke(self, inputs: dict, **kwargs) -> Any:
        user_input = inputs.get("input", inputs.get("query", inputs.get("message", "")))
        if isinstance(user_input, str):
            self._shield.inspect_input(user_input)
        self._shield.sentinel.reset_turn()
        return self._agent.invoke(inputs, **kwargs)

    async def ainvoke(self, inputs: dict, **kwargs) -> Any:
        user_input = inputs.get("input", inputs.get("query", inputs.get("message", "")))
        if isinstance(user_input, str):
            self._shield.inspect_input(user_input)
        self._shield.sentinel.reset_turn()
        return await self._agent.ainvoke(inputs, **kwargs)

    def __getattr__(self, name: str) -> Any:
        return getattr(self._agent, name)
