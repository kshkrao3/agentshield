import time
import pytest
from agentshield import AuditEmitter, MemoryGuard, Policy


@pytest.fixture
def emitter():
    return AuditEmitter(config={"mode": "silent"})


def test_basic_write_read(emitter):
    g = MemoryGuard(Policy(), emitter)
    g.write("user_pref", "dark_mode")
    assert g.read("user_pref") == "dark_mode"


def test_ttl_expiry(emitter):
    policy = Policy(memory_ttl=1)
    g = MemoryGuard(policy, emitter)
    g.write("key", "value")
    time.sleep(1.1)
    assert g.read("key") is None


def test_untrusted_write_blocked(emitter):
    policy = Policy(on_violation="block")
    g = MemoryGuard(policy, emitter)
    result = g.write("injected", "bad_value", trusted=False)
    assert result is False
    assert g.read("injected") is None


def test_untrusted_write_warn_mode(emitter):
    policy = Policy(on_violation="warn")
    g = MemoryGuard(policy, emitter)
    result = g.write("injected", "bad_value", trusted=False)
    assert result is True  # written but flagged


def test_mark_untrusted_quarantines_on_read(emitter):
    policy = Policy(on_violation="quarantine")
    g = MemoryGuard(policy, emitter)
    g.write("key", "safe_value")
    g.mark_untrusted("key")
    assert g.read("key") is None


def test_capacity_limit(emitter):
    policy = Policy(max_memory_entries=2)
    g = MemoryGuard(policy, emitter)
    g.write("a", 1)
    g.write("b", 2)
    result = g.write("c", 3)  # over limit
    assert result is False


def test_evict_expired(emitter):
    policy = Policy(memory_ttl=1)
    g = MemoryGuard(policy, emitter)
    g.write("x", "val")
    time.sleep(1.1)
    g.evict_expired()
    assert "x" not in g._store
