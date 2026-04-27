# Contributing to agentshield

## Before you start

- Search existing issues before opening a new one
- For security vulnerabilities, see [SECURITY.md](../SECURITY.md) — do NOT open a public issue

## Pull Requests

1. Fork the repo, create a branch: `git checkout -b feat/your-feature`
2. Write tests for your change
3. Run tests: `cd python && .venv/bin/python -m pytest`
4. Submit PR against `main` — all checks must pass

## Code Standards

- Python: follow existing style, no heavy dependencies
- TypeScript: ESM-only, strict mode
- No new required dependencies without discussion in an issue first
- Detection patterns (firewall.py) must include a test case for the new pattern

## Licensing

By submitting a PR you agree your contribution is licensed under Apache 2.0.
