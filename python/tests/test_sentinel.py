import pytest
from agentshield import AuditEmitter, Policy, ToolSentinel


@pytest.fixture
def emitter():
    e = AuditEmitter(config={"mode": "silent"})
    return e


def test_allowlist_blocks_unknown_tool(emitter):
    policy = Policy(tool_allowlist=["calculator", "web_search"])
    s = ToolSentinel(policy, emitter)
    assert s.check_tool_call("calculator") is True
    assert s.check_tool_call("file_write") is False


def test_denylist_blocks_explicitly(emitter):
    policy = Policy(tool_denylist=["shell_exec"])
    s = ToolSentinel(policy, emitter)
    assert s.check_tool_call("shell_exec") is False
    assert s.check_tool_call("calculator") is True


def test_rate_limit_per_turn(emitter):
    policy = Policy(max_tool_calls_per_turn=3)
    s = ToolSentinel(policy, emitter)
    assert s.check_tool_call("tool_a") is True
    assert s.check_tool_call("tool_a") is True
    assert s.check_tool_call("tool_a") is True
    assert s.check_tool_call("tool_a") is False  # 4th call blocked


def test_reset_turn_resets_count(emitter):
    policy = Policy(max_tool_calls_per_turn=2)
    s = ToolSentinel(policy, emitter)
    s.check_tool_call("tool_a")
    s.check_tool_call("tool_a")
    s.reset_turn()
    assert s.check_tool_call("tool_a") is True  # allowed again after reset


def test_no_allowlist_allows_any(emitter):
    policy = Policy(tool_allowlist=None)
    s = ToolSentinel(policy, emitter)
    assert s.check_tool_call("anything_goes") is True
