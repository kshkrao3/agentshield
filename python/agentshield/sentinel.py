from collections import defaultdict
from typing import Any, Optional

from .audit import AuditEmitter, ViolationEvent
from .policy import Policy


class ToolSentinel:
    def __init__(self, policy: Policy, emitter: AuditEmitter, session_id: Optional[str] = None):
        self._policy = policy
        self._emitter = emitter
        self._session_id = session_id
        self._call_counts: dict[str, int] = defaultdict(int)
        self._turn_call_count = 0

    def reset_turn(self):
        self._turn_call_count = 0

    def check_tool_call(self, tool_name: str, tool_input: Optional[dict] = None) -> bool:
        """Returns True if tool call is allowed, False if blocked."""
        # Denylist check — hard block
        if tool_name in self._policy.tool_denylist:
            self._emit("tool_misuse", "critical", f"Tool '{tool_name}' is explicitly denied")
            return False

        # Allowlist check — if allowlist set, block anything not in it
        if self._policy.tool_allowlist is not None:
            if tool_name not in self._policy.tool_allowlist:
                self._emit(
                    "privilege_escalation",
                    "high",
                    f"Tool '{tool_name}' not in allowlist {self._policy.tool_allowlist}",
                )
                return False

        # Rate limiting per turn
        self._turn_call_count += 1
        if self._turn_call_count > self._policy.max_tool_calls_per_turn:
            self._emit(
                "tool_misuse",
                "medium",
                f"Tool call limit ({self._policy.max_tool_calls_per_turn}/turn) exceeded",
            )
            return False

        self._call_counts[tool_name] += 1
        return True

    def _emit(self, type_: str, severity: str, detail: str):
        self._emitter.emit(
            ViolationEvent(
                type=type_,
                severity=severity,
                detail=detail,
                session_id=self._session_id,
            )
        )
