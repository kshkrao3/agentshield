import time
from dataclasses import dataclass, field
from typing import Any, Optional

from .audit import AuditEmitter, ViolationEvent
from .policy import Policy


@dataclass
class MemoryEntry:
    key: str
    value: Any
    created_at: float = field(default_factory=time.time)
    trusted: bool = True


class MemoryGuard:
    def __init__(self, policy: Policy, emitter: AuditEmitter, session_id: Optional[str] = None):
        self._policy = policy
        self._emitter = emitter
        self._session_id = session_id
        self._store: dict[str, MemoryEntry] = {}

    def write(self, key: str, value: Any, trusted: bool = True) -> bool:
        """Store a memory entry. Returns False if rejected."""
        if len(self._store) >= self._policy.max_memory_entries:
            self._emit("memory_poison", "medium", "Memory store at capacity — entry rejected")
            return False

        if not trusted:
            self._emit(
                "memory_poison",
                "high",
                f"Untrusted memory write attempted for key '{key}'",
            )
            if self._policy.on_violation == "block":
                return False

        self._store[key] = MemoryEntry(key=key, value=value, trusted=trusted)
        return True

    def read(self, key: str) -> Optional[Any]:
        """Read and validate a memory entry, respecting TTL."""
        entry = self._store.get(key)
        if entry is None:
            return None

        if self._policy.memory_ttl > 0:
            age = time.time() - entry.created_at
            if age > self._policy.memory_ttl:
                del self._store[key]
                return None

        if not entry.trusted:
            self._emit(
                "memory_poison",
                "high",
                f"Read of untrusted memory entry '{key}' — value quarantined",
            )
            if self._policy.on_violation in ("block", "quarantine"):
                return None

        return entry.value

    def evict_expired(self):
        if self._policy.memory_ttl <= 0:
            return
        now = time.time()
        expired = [k for k, e in self._store.items() if now - e.created_at > self._policy.memory_ttl]
        for k in expired:
            del self._store[k]

    def mark_untrusted(self, key: str):
        if key in self._store:
            self._store[key].trusted = False

    def _emit(self, type_: str, severity: str, detail: str):
        self._emitter.emit(
            ViolationEvent(
                type=type_,
                severity=severity,
                detail=detail,
                session_id=self._session_id,
            )
        )
