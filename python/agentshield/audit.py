import json
import time
from dataclasses import asdict, dataclass
from typing import Any, Callable, Literal, Optional


@dataclass
class ViolationEvent:
    type: Literal["injection", "tool_misuse", "memory_poison", "privilege_escalation"]
    severity: Literal["low", "medium", "high", "critical"]
    detail: str
    timestamp: float = 0.0
    session_id: Optional[str] = None
    metadata: dict = None

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = time.time()
        if self.metadata is None:
            self.metadata = {}


class AuditEmitter:
    def __init__(self, config: Optional[dict] = None):
        self._config = config or {}
        self._handlers: list[Callable[[ViolationEvent], None]] = []
        self._add_default_handler()

    def _add_default_handler(self):
        mode = self._config.get("mode", "stdout")
        if mode == "stdout":
            self._handlers.append(self._stdout_handler)
        elif mode == "silent":
            pass
        if webhook := self._config.get("webhook"):
            self._handlers.append(self._make_webhook_handler(webhook))

    def _stdout_handler(self, event: ViolationEvent):
        print(f"[agentshield] {event.severity.upper()} {event.type}: {event.detail}")

    def _make_webhook_handler(self, url: str) -> Callable:
        import urllib.request

        def handler(event: ViolationEvent):
            payload = json.dumps(asdict(event)).encode()
            req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
            try:
                urllib.request.urlopen(req, timeout=2)
            except Exception:
                pass

        return handler

    def on_violation(self, handler: Callable[[ViolationEvent], None]):
        self._handlers.append(handler)

    def emit(self, event: ViolationEvent):
        for handler in self._handlers:
            try:
                handler(event)
            except Exception:
                pass
