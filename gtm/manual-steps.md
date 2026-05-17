# Manual GTM Steps

---

## 1. Show HN (Hacker News)

**Best time:** Monday–Wednesday, 9–11am ET

**Steps:**
1. Go to https://news.ycombinator.com
2. Log in (or create account at https://news.ycombinator.com/login)
3. Click **"submit"** in the top nav
4. Fill in:
   - **title:** `Show HN: AgentShield – open-source runtime security for LLM agents (prompt injection, tool misuse, memory poisoning)`
   - **url:** `https://kshkrao3.github.io/agentshield/`
5. Click Submit — you'll land on the post page
6. Add a **comment on your own post immediately** (this is expected on Show HN). Paste the body text from `gtm/show-hn.md` starting from "Most LLM security advice is..."
7. Reply to every comment within the first 2 hours — engagement in the first hour heavily influences ranking

**Do NOT:**
- Ask friends to upvote (HN detects vote rings and kills posts)
- Submit the same URL twice
- Edit the title after submitting

---

## 2. Dev.to Article

**Steps:**
1. Go to https://dev.to and sign in (or sign up — free)
2. Click your avatar → **"Create Post"** (or go to https://dev.to/new)
3. Paste the content from `gtm/devto-article.md`:
   - **Title:** `How attackers hijack LLM agents — and how to stop them`
   - **Tags:** `ai`, `python`, `security`, `llm`
4. In the front matter / tags box add: `ai, python, security, llm`
5. Click **"Edit"** and verify code blocks render correctly
6. Set a **cover image** — use a screenshot of the landing page hero (https://kshkrao3.github.io/agentshield/) or a dark terminal screenshot
7. Click **"Publish"**
8. After publishing, copy the article URL and add it as a comment on your HN post: `"I wrote a longer technical breakdown here: [url]"`

**Optional — cross-post to Hashnode:**
1. Go to https://hashnode.com → New Article
2. Paste the same content
3. Set canonical URL to the Dev.to URL (prevents duplicate content penalty)
4. Publish to your Hashnode blog

---

## 3. Twitter / X Thread

**Steps:**
1. Go to https://twitter.com (or x.com) and log in
2. Click **"+"** to start a new post
3. Type Tweet 1 from `gtm/twitter-thread.md`:
   > A production LLM agent got fully hijacked last month...
4. Click **"+"** inside the composer to add the next tweet (creates a thread)
5. Paste each tweet in order — 10 tweets total
6. For Tweet 4 and Tweet 8 (code snippets) — the code blocks won't render as markdown on X. Format them as plain text or use a screenshot instead
7. Click **"Tweet all"** to publish the thread at once

**After posting:**
- Pin it to your profile
- Share the thread URL in the HN comments
- Share in your LinkedIn if you have developer followers

**Code screenshot tip (for tweets with code):**
- Go to https://carbon.now.sh
- Paste the code snippet, theme: "Night Owl", background: transparent
- Download as PNG and attach to the tweet instead of pasting raw text

---

## 4. Reddit — r/LangChain

**Steps:**
1. Go to https://reddit.com/r/LangChain
2. Click **"Create Post"**
3. Choose **"Text"** post type
4. **Title:** `I built a drop-in security middleware for LangChain agents — blocks prompt injection, tool misuse, memory poisoning`
5. **Body:**
```
After watching a production agent get hijacked through a poisoned RAG document, I built AgentShield — a zero-dependency runtime security middleware with a native LangChain adapter.

Three lines to protect your agent:

```python
from agentshield.adapters.langchain import shield_tools
safe_tools = shield_tools(tools, shield)
agent = initialize_agent(safe_tools, llm, ...)
```

It catches:
- Direct prompt injection ("ignore previous instructions")
- Indirect injection via RAG chunks and tool responses
- Tool privilege escalation (allowlists + rate limiting)
- Memory poisoning across turns (untrusted write quarantine)
- Encoding bypasses (base64, unicode zero-width chars)

Open source, Apache 2.0: https://github.com/kshkrao3/agentshield
pip install apexguard

Curious what injection patterns others are seeing in the wild.
```

---

## 5. Reddit — r/netsec

**Steps:**
1. Go to https://reddit.com/r/netsec
2. Read the sidebar rules first — r/netsec requires technical depth, no marketing fluff
3. **Title:** `AgentShield: runtime security middleware for LLM agents — prompt injection, tool misuse, memory poisoning [OSS]`
4. **Body:** Use the Dev.to article summary (first 4 attack classes + code examples). Lead with the attack story, not the product.
5. Post type: **Link** → link to Dev.to article URL (not the GitHub page — r/netsec prefers technical writeups over repo links)

---

## 6. Reddit — r/MachineLearning

**Steps:**
1. Go to https://reddit.com/r/MachineLearning
2. Post type: **Discussion**
3. **Title:** `[D] Practical prompt injection defense for LLM agents — what patterns are you seeing?`
4. Frame it as a discussion question, not a product post. Share the library as "what I built to address this" — r/ML responds better to problem-first framing.

---

## Recommended posting order + timing

| Day | Action |
|-----|--------|
| Day 1 (Mon) 9am ET | Post Show HN |
| Day 1 (Mon) 10am ET | Publish Dev.to article, link in HN comments |
| Day 1 (Mon) 11am ET | Fire Twitter thread, link to HN post |
| Day 1 (Mon) noon | Post r/LangChain |
| Day 2 (Tue) | Post r/netsec (link to Dev.to article) |
| Day 3 (Wed) | Post r/MachineLearning |
| Ongoing | Reply to HN + Reddit comments, cross-post Hashnode |
