# agentshield

Runtime security middleware for LLM agents. **Zero external calls. No data leaves your environment.**

Drop it into your existing agent framework — no refactor required.

**Defends against:**
- Prompt injection (user input hijacking system instructions)
- Tool misuse & privilege escalation (agents calling tools outside intended scope)
- Memory poisoning (persistent agent memory corrupted across sessions)
- RAG context injection (poisoned document chunks injecting instructions)

---

## Why agentshield vs. cloud-only solutions

| | agentshield | Cloud-dependent alternatives |
|---|---|---|
| External API calls | None — all logic runs in-process | Every check phones home |
| Latency | <1ms (pattern matching) | 50–500ms round-trip |
| Data leaves environment | Never | On every agent turn |
| Works offline / air-gapped | Yes | No |
| Self-hostable | Yes (Apache 2.0) | Rarely |
| Optional cloud dashboard | Yes ([agentshield cloud](https://agentshield.dev)) | Required |

The core SDK never makes a network call. Violations are caught locally — your agent's inputs and outputs stay in your stack.

---

## Install

```bash
pip install apexguard
# or
npm install @apexguard/sdk
```

---

## Python — 30-second quickstart

```python
from apexguard import Shield, Policy

shield = Shield(
    policy=Policy(
        tool_allowlist=["calculator", "web_search"],
        memory_ttl=3600,
        injection_sensitivity="medium",
        on_violation="block",
    )
)

# Wrap your existing LangChain agent
secured_agent = shield.wrap(your_langchain_agent)
result = secured_agent.invoke({"input": user_query})
```

### LangChain tool integration

```python
from apexguard.adapters.langchain import shield_tools

secured_tools = shield_tools(your_tools, shield)
agent = create_react_agent(llm, secured_tools, prompt)
```

### Custom violation handler

```python
shield.on_violation(lambda e: send_to_slack(e))
```

---

## TypeScript — 30-second quickstart

```typescript
import { Shield } from '@apexguard/sdk';

const s = new Shield({
  policy: {
    toolAllowlist: ['calculator', 'webSearch'],
    memoryTTL: 3600,
    injectionSensitivity: 'medium',
    onViolation: 'block',
  },
});

const securedAgent = s.wrap(yourAgent);
```

### Vercel AI SDK tools

```typescript
import { shieldTools } from '@apexguard/sdk/adapters/vercel-ai';

const result = await generateText({
  model: openai('gpt-4o'),
  tools: shieldTools({ calculator, webSearch }, s),
  prompt: userInput,
});
```

---

## Modules

| Module | What it does |
|--------|-------------|
| `PromptFirewall` | Pattern-matching injection detector — 0 external calls, <1ms |
| `ToolSentinel` | Allowlist/denylist + per-turn rate limiting for tool calls |
| `MemoryGuard` | TTL enforcement + untrusted-write quarantine for agent memory |

---

## Policy options

| Option | Default | Description |
|--------|---------|-------------|
| `tool_allowlist` | `None` | Whitelist of permitted tool names. `None` = all allowed |
| `tool_denylist` | `[]` | Hard-blocked tool names |
| `memory_ttl` | `3600` | Memory entry lifetime in seconds. `0` = no expiry |
| `injection_sensitivity` | `"medium"` | Pattern set: `low` / `medium` / `high` |
| `on_violation` | `"warn"` | `"warn"` (log only), `"block"` (raise), `"quarantine"` (suppress) |
| `max_tool_calls_per_turn` | `20` | Rate limit per agent turn |
| `max_memory_entries` | `1000` | Cap on memory store size |

---

## License

Apache 2.0
