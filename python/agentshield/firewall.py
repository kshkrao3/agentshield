import re
from typing import Optional

from .audit import AuditEmitter, ViolationEvent
from .policy import Policy

# Common prompt injection patterns — no external LLM call needed
_INJECTION_PATTERNS_LOW = [
    r"ignore\s+(previous|all|above|prior)(\s+\w+)?\s+(instructions?|prompts?|rules?|context)",
    r"disregard\s+(your\s+)?(previous|all|above|prior)\s+(instructions?|prompts?|rules?)",
    r"forget\s+(everything|all|your\s+instructions)",
    r"you\s+are\s+now\s+(a|an)\s+\w+",
    r"act\s+as\s+(if\s+you\s+are|a|an)\s+",
    r"new\s+system\s+prompt",
    r"system:\s*(you|ignore|forget)",
]

_INJECTION_PATTERNS_MEDIUM = _INJECTION_PATTERNS_LOW + [
    r"override\s+(your\s+)?(instructions?|rules?|guidelines?|behavior)",
    r"your\s+(true|real|actual)\s+(purpose|goal|mission|task)",
    r"developer\s+mode",
    r"jailbreak",
    r"do\s+anything\s+now",
    r"dan\s+mode",
    r"pretend\s+(you\s+are|to\s+be)",
    r"simulate\s+(being|a|an)",
    r"<\s*/?system\s*>",
    r"\[system\]",
    r"{{.*}}",  # template injection attempts
    # Indirect injection via tool/RAG responses
    r"(assistant|ai|model)\s+has\s+been\s+(updated|reprogrammed|reconfigured)",
    r"maintenance\s+mode",
    r"safe\s+mode\s+(disabled|off)",
    # Role escape attempts
    r"you\s+(have\s+no|don'?t\s+have)\s+(restrictions?|limits?|rules?|guidelines?)",
    r"without\s+(any\s+)?(restrictions?|limits?|filters?|guidelines?|rules?)",
    r"unrestricted\s+(mode|access|output)",
]

_INJECTION_PATTERNS_HIGH = _INJECTION_PATTERNS_MEDIUM + [
    r"repeat\s+(after\s+me|the\s+following)",
    r"what\s+(are|were)\s+your\s+(instructions?|system\s+prompt)",
    r"print\s+(your\s+)?(instructions?|system\s+prompt|prompt)",
    r"reveal\s+(your\s+)?(instructions?|system\s+prompt|context)",
    r"show\s+(me\s+)?(your\s+)?(instructions?|system\s+prompt)",
    r"translate\s+(your\s+)?(instructions?|system\s+prompt)",
    r"escape\s+sequence",
    r"prompt\s+leak",
    # Encoding / obfuscation bypass attempts
    r"base64\s*(decode|encoded)",
    r"rot13",
    r"hex\s*decode",
    # Multi-turn context manipulation
    r"for\s+(the\s+)?rest\s+of\s+(this\s+)?(conversation|session|chat)",
    r"from\s+(now|this\s+point)\s+on\s+(you|ignore|forget|act)",
    # Prompt exfiltration
    r"(send|email|post|output|print|write)\s+(your\s+)?(system\s+prompt|instructions?)\s+(to|at|as)",
    r"extract\s+(your\s+)?(system\s+prompt|instructions?|context|rules?)",
    # ASCII/unicode smuggling markers
    r"[​‌‍⁠﻿]",  # zero-width characters
    r"<!--.*?-->",  # HTML comment injection
    r"\/\*.*?\*\/",  # comment injection
]

_PATTERN_MAP = {
    "low": [re.compile(p, re.IGNORECASE) for p in _INJECTION_PATTERNS_LOW],
    "medium": [re.compile(p, re.IGNORECASE | re.DOTALL) for p in _INJECTION_PATTERNS_MEDIUM],
    "high": [re.compile(p, re.IGNORECASE | re.DOTALL) for p in _INJECTION_PATTERNS_HIGH],
}


class PromptFirewall:
    def __init__(self, policy: Policy, emitter: AuditEmitter, session_id: Optional[str] = None):
        self._policy = policy
        self._emitter = emitter
        self._session_id = session_id
        self._patterns = _PATTERN_MAP[policy.injection_sensitivity]

    def inspect(self, user_input: str) -> bool:
        """Returns True if input is safe, False if a violation is detected."""
        for pattern in self._patterns:
            if pattern.search(user_input):
                event = ViolationEvent(
                    type="injection",
                    severity="high",
                    detail=f"Prompt injection pattern matched: {pattern.pattern[:60]}",
                    session_id=self._session_id,
                    metadata={"matched_input_snippet": user_input[:200]},
                )
                self._emitter.emit(event)
                return False
        return True

    def inspect_rag_chunk(self, chunk: str) -> bool:
        """Inspect a RAG-retrieved document chunk for injected instructions."""
        return self.inspect(chunk)
