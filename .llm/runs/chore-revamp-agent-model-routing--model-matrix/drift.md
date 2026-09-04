# Drift Log: agent model routing and subscription expense policy revamp

## 2026-09-04 — Owner matrix supersedes the legacy routing policy

- **What:** Replace, rather than incrementally tune, the current delegation and fallback matrix.
- **Source:** `/home/agent/tmp/Harness Agents models matrix.md` and the owner's 2026-09-04
  instruction.
- **Expected:** `workflow/lane-policy.md` and `CANONICAL_ROUTE_POLICY` currently encode the
  pre-Astra policy.
- **Actual:** The new source of truth assigns Astra, Luna, SOL, Fable, Muse, GLM, Qwen, MiniMax,
  Gemini, Kimi, Grok, and provider precedence by task role and complexity.
- **Severity:** architectural
- **Action:** fix
- **Evidence:** owner matrix and completed repository policy inventory.

### Reconciliation

Repository inventory confirmed the flat legacy table, old evaluator escalation rules, and repeated
human-policy prose all conflict with the replacement matrix. The locked plan replaces active
selection and retains old IDs/lanes only at explicit persisted-state compatibility boundaries.

## 2026-09-04 — Current coordinator cannot attest its surfaced model identity

- **What:** The bootstrap task transport does not expose a repository-verifiable exact model/effort
  identity.
- **Source:** current Codex desktop task environment.
- **Expected:** every route records requested and observed model and effort.
- **Actual:** only the Codex task transport is observable; no exact identity receipt is available.
- **Severity:** significant
- **Action:** accept for bootstrap only; require identity receipts for launched evaluator and test
  routes.
- **Evidence:** `supervisor.md`.

## 2026-09-04 — Subscription expense watcher does not exist

- **What:** The owner requires Go and Ollama limits in the harness expense watcher.
- **Expected:** A pre-dispatch, structured allowance decision for paid fallback routes.
- **Actual:** The runtime persists quota/failure transitions but has no monetary subscription-window
  evaluator; OpenCode dispatch unconditionally loads OpenRouter auth.
- **Severity:** critical
- **Action:** fix in S3; fail closed on unknown/stale usage and prevent implicit overflow spending.
- **Evidence:** focused scan of `.llm/tools/agentic/runtime`, OpenCode runner, CLI task map, and
  tests.
