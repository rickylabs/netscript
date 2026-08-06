# Drift Log: canonical Qwen 3.8 formal evaluator

Drift is append-only.

## 2026-08-06 — Owner-authorized routing overrides

- **What:** This run does not use the current lane-policy 3.7 formal evaluator or Anthropic
  ordinary-review routes.
- **Source:** Owner mission for issue #1331.
- **Expected:** Baseline policy binds formal evaluation to `qwen/qwen3.7-max` and ordinary Codex
  review to Anthropic models.
- **Actual:** Formal PLAN-EVAL and IMPL-EVAL must use distinct OpenRouter `qwen/qwen3.8-max`
  sessions. Anthropic subscription is exhausted until Saturday; ordinary review temporarily uses
  owner-authorized OpenRouter Kimi K3 or Grok 4.5.
- **Severity:** significant
- **Action:** accept for this run; fix the stale canonical formal route through issue #1331.
- **Evidence:** `supervisor.md`; issue #1331; `implement.md`.

## 2026-08-06 — Unrelated lockfile state

- **What:** `deno.lock` was modified before harness bootstrap.
- **Source:** Direct raw Git status and diff at run start.
- **Expected:** Clean branch at `origin/main` before run artifacts.
- **Actual:** Branch has an unrelated dependency-resolution lock diff plus the untracked run dir.
- **Severity:** minor
- **Action:** defer to its owner; do not edit, stage, revert, or commit it.
- **Evidence:** `git diff -- deno.lock`; baseline `57c9b5ab3`.
