from dataclasses import dataclass, field
from typing import Literal, Optional


@dataclass
class Policy:
    tool_allowlist: Optional[list[str]] = None
    tool_denylist: list[str] = field(default_factory=list)
    memory_ttl: int = 3600  # seconds; 0 = no expiry
    injection_sensitivity: Literal["low", "medium", "high"] = "medium"
    on_violation: Literal["warn", "block", "quarantine"] = "warn"
    max_tool_calls_per_turn: int = 20
    max_memory_entries: int = 1000
