# Drift Log: agent init tooling and docs bundles

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-03 — baseline advanced to consume the concurrent docs router

- **What:** The user-provided base `ab0fa13fe` was superseded during research by merged PR #1079.
- **Source:** GitHub PR #1079; `git fetch origin main`; merge commit `e5bae2858`.
- **Expected:** Begin from `origin/main` at `ab0fa13fe` while a concurrent docs slice owned #1068.
- **Actual:** #1079 merged cleanly and now supplies the required task router on `origin/main`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** branch rebased while clean; current `HEAD == origin/main == e5bae2858` before the
  harness bootstrap commit.

## 2026-08-03 — owner-started session route identity is opaque

- **What:** The active Codex session does not expose a configurable exact model id or a separate
  Fable orchestrator session.
- **Source:** runtime session metadata available to the assistant.
- **Expected:** lane-policy's named `planning_decisions` orchestrator and explicit Codex
  implementation route.
- **Actual:** the user directly started this Codex session and requested `use harness`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` records the owner-authorized current session; formal Qwen evaluation
  and opposite-family slice review remain separate and canonical.

## 2026-08-03 — local formal evaluator route lacks credentials

- **What:** The canonical local OpenRouter/Qwen PLAN-EVAL canary could not authenticate.
- **Source:** `deno task agentic:provider-canary --live --profile claude-openrouter
  --model qwen/qwen3.7-max --effort high --worktree /home/codex/repos/ns004-agenttools`.
- **Expected:** A separate local Qwen session writes the tracked PLAN-EVAL verdict.
- **Actual:** The canary returned `BLOCKED` with reason `auth_required`; no evaluator process was
  launched and no implementation began.
- **Severity:** moderate
- **Action:** accept a separate OpenHands/OpenRouter Qwen evaluator as the harness fallback.
- **Evidence:** exact canary command and observed `auth_required` result are recorded in the
  worklog; the tracked `plan-eval.md` remains the only verdict authority.
