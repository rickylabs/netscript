# Drift Log: durable OpenRouter agentic lanes

## 2026-07-12 — Launcher path evolved since failure report

- **What:** The launcher no longer directly composes `codex --profile ... debug app-server send-message-v2`; it invokes the repo-owned app-server JSONL client, which still carries the named profile into initialization.
- **Source:** `.llm/tools/agentic/codex/launch-codex-slice.ts` and `app-server-message-cli.ts`.
- **Expected:** Direct unsupported top-level profile flag from the carried-in run-eval.
- **Actual:** The bug boundary moved to profile materialization/client initialization; the supported isolated profile is still not launcher-owned.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `research.md` findings 1–3.
