"""
Cloud reporter — buffers ViolationEvents and ships batches to AgentShield Cloud.

Designed to be drop-in: pass to Shield(reporter=Reporter(api_key=...)) and the
Shield will forward every emitted violation to the reporter in addition to its
local handlers. Reporter never raises; transport errors are swallowed so a
network outage in cloud cannot crash the host application.
"""
from __future__ import annotations

import atexit
import json
import threading
import time
import urllib.error
import urllib.request
from dataclasses import asdict
from typing import Any, Optional

from .audit import ViolationEvent

DEFAULT_ENDPOINT = "https://ingest.agentshield.dev/v1/events"
SDK_VERSION = "0.1.0"

# Map internal event type names to the cloud schema.
_TYPE_MAP = {
    "injection": "injection",
    "tool_misuse": "tool",
    "privilege_escalation": "tool",
    "memory_poison": "memory",
}

# Map internal severity to cloud schema (collapse 'critical' to 'high').
_SEVERITY_MAP = {
    "low": "low",
    "medium": "medium",
    "high": "high",
    "critical": "high",
}


class Reporter:
    """Buffered, batched, fire-and-forget HTTP reporter for AgentShield Cloud."""

    def __init__(
        self,
        api_key: str,
        endpoint: str = DEFAULT_ENDPOINT,
        batch_size: int = 50,
        flush_interval_s: float = 5.0,
        max_buffer: int = 5000,
        request_timeout_s: float = 5.0,
        max_retries: int = 3,
    ) -> None:
        if not api_key or not api_key.startswith("ask_"):
            raise ValueError("api_key must be a valid AgentShield key starting with 'ask_'")
        self._api_key = api_key
        self._endpoint = endpoint
        self._batch_size = batch_size
        self._flush_interval_s = flush_interval_s
        self._max_buffer = max_buffer
        self._request_timeout_s = request_timeout_s
        self._max_retries = max_retries

        self._buf: list[dict[str, Any]] = []
        self._lock = threading.Lock()
        self._stop = threading.Event()
        self._thread = threading.Thread(target=self._run, daemon=True, name="agentshield-reporter")
        self._thread.start()
        atexit.register(self.shutdown)

    # ----- public surface (called by Shield via AuditEmitter) -----

    def __call__(self, event: ViolationEvent) -> None:
        """Audit emitter handler signature."""
        self.report(event)

    def report(self, event: ViolationEvent) -> None:
        payload = self._serialize(event)
        with self._lock:
            if len(self._buf) >= self._max_buffer:
                # Drop oldest to bound memory under sustained pressure.
                self._buf.pop(0)
            self._buf.append(payload)
            should_flush = len(self._buf) >= self._batch_size
        if should_flush:
            self._flush_async()

    def flush(self) -> None:
        """Block until current buffer is sent (or fails permanently)."""
        with self._lock:
            batch = self._buf[:]
            self._buf.clear()
        if batch:
            self._send(batch)

    def shutdown(self) -> None:
        if self._stop.is_set():
            return
        self._stop.set()
        try:
            self.flush()
        except Exception:
            pass

    # ----- internals -----

    def _serialize(self, event: ViolationEvent) -> dict[str, Any]:
        d = asdict(event)
        return {
            "type": _TYPE_MAP.get(d["type"], "injection"),
            "severity": _SEVERITY_MAP.get(d["severity"], "medium"),
            "message": d.get("detail"),
            "session_id": d.get("session_id"),
            "metadata": d.get("metadata") or {},
            "occurred_at": _iso_timestamp(d.get("timestamp")),
        }

    def _flush_async(self) -> None:
        with self._lock:
            if not self._buf:
                return
            batch = self._buf[: self._batch_size]
            self._buf = self._buf[self._batch_size :]
        threading.Thread(target=self._send, args=(batch,), daemon=True).start()

    def _run(self) -> None:
        while not self._stop.wait(self._flush_interval_s):
            self._flush_async()

    def _send(self, events: list[dict[str, Any]]) -> None:
        if not events:
            return
        body = json.dumps({
            "sdk_language": "python",
            "sdk_version": SDK_VERSION,
            "events": events,
        }).encode("utf-8")
        req = urllib.request.Request(
            self._endpoint,
            data=body,
            headers={
                "content-type": "application/json",
                "authorization": f"Bearer {self._api_key}",
                "user-agent": f"agentshield-python/{SDK_VERSION}",
            },
            method="POST",
        )
        backoff = 0.5
        for attempt in range(self._max_retries):
            try:
                with urllib.request.urlopen(req, timeout=self._request_timeout_s) as resp:
                    if 200 <= resp.status < 300:
                        return
                    if resp.status == 429 or resp.status >= 500:
                        time.sleep(backoff)
                        backoff *= 2
                        continue
                    return  # 4xx (other) — drop, body was probably bad
            except urllib.error.HTTPError as e:
                if e.code == 429 or e.code >= 500:
                    time.sleep(backoff)
                    backoff *= 2
                    continue
                return
            except (urllib.error.URLError, TimeoutError, OSError):
                time.sleep(backoff)
                backoff *= 2


def _iso_timestamp(ts: Optional[float]) -> Optional[str]:
    if ts is None:
        return None
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(ts))
