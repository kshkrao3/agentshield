# Awesome List Submission Targets

## High priority — submit PRs to these

### 1. awesome-llm-security
URL: https://github.com/corca-ai/awesome-llm-security
Section: "Tools & Frameworks > Defense"
Entry:
```
- [AgentShield](https://github.com/kshkrao3/agentshield) - Runtime security middleware for LLM agents. Blocks prompt injection, tool misuse, and memory poisoning. Zero dependencies, Python + TypeScript.
```

### 2. awesome-langchain
URL: https://github.com/kyrolabs/awesome-langchain
Section: "Tools > Safety & Security"
Entry:
```
- [AgentShield](https://github.com/kshkrao3/agentshield) - Drop-in security middleware with LangChain adapter. Detects prompt injection, enforces tool allowlists, guards agent memory.
```

### 3. awesome-ai-safety
URL: https://github.com/hari-rangarajan/awesome-ai-safety (check if active)
Section: "Tools"
Entry: same as #1

### 4. llm-security (OWASP LLM Top 10 community list)
URL: https://github.com/OWASP/www-project-top-10-for-large-language-model-applications
File: docs/llm_tools.md or similar
Entry:
```
AgentShield — runtime middleware addressing LLM01 (Prompt Injection), LLM07 (Insecure Plugin Design), LLM08 (Excessive Agency)
```

### 5. awesome-llamaindex
URL: https://github.com/emptycrown/llama-hub (or community list)
Section: "Security"

---

## PR message template

Title: `Add AgentShield — runtime security middleware for LLM agents`

Body:
> AgentShield is an open-source, zero-dependency runtime security library for LLM agents. It blocks prompt injection (direct + indirect via RAG), tool misuse via allowlists/denylists, and memory poisoning via trust-level quarantine.
>
> - PyPI: `pip install apexguard` (600+ downloads since launch)
> - npm: `npm install @apexguard/sdk`
> - Apache 2.0 license
> - Adapters for LangChain, LlamaIndex, OpenAI Agents SDK, Vercel AI SDK
>
> GitHub: https://github.com/kshkrao3/agentshield

---

## Reddit communities to post in

- r/LangChain — post the article, ask for feedback on pattern coverage
- r/MachineLearning — frame as a research/engineering problem
- r/ChatGPTPro — "how I protected my ChatGPT-powered app"
- r/LocalLLaMA — angle: works with any model, not just OpenAI
- r/netsec — security angle, the RAG injection story
- r/Python — clean API, zero deps angle

## Discord / Slack communities

- LangChain Discord (#show-and-tell or #tools)
- LlamaIndex Discord
- Hugging Face Discord
- AI Engineers Discord (aiengineers.com)
- Latent Space Discord
