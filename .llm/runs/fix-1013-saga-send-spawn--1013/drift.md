# Drift Log: saga send/spawn correction (#1013)

Drift is append-only.

## 2026-08-03 — #1075 turns stale tutorial sends into loud unknown-message failures

- **What:** The remaining storefront `send()` calls are no longer merely misrouted/ignored. The
  merged `SagaBusBridge.#handleAndDispatch` recursively consumes each ledger and immediately
  republishes the target id into the saga engine.
- **Source:** PR #1075 merge `2d58481e4`; current `saga-bus-bridge.ts`.
- **Expected:** The carried-in issue framed `send()` as republishing instead of reaching workers,
  while #1042's test manually dispatched returned ledgers.
- **Actual:** Current `publish()` automatically dispatches effects; every tutorial target without a
  registered saga handler throws `SAGA_NOT_FOUND`.
- **Severity:** significant
- **Action:** fix
- **Evidence:** `git show 2d58481e4 -- packages/plugin-sagas-core/src/adapters/saga-bus-bridge.ts`

## 2026-08-03 — Local Qwen PLAN-EVAL transport is credential-blocked

- **What:** The canonical local Claude Code + OpenRouter evaluator could not launch.
- **Source:** `agentic:provider-canary` for the bound formal-evaluation route.
- **Expected:** A separate Qwen evaluator writes `plan-eval.md` before implementation.
- **Actual:** The canary returned `status: blocked`, diagnostic `auth_required`, and
  `credential: absent`; no evaluator session was created. OpenHands is prohibited for local runs
  and closed-model substitutes are prohibited.
- **Severity:** significant
- **Action:** defer
- **Evidence:** `deno task agentic:provider-canary --live --profile claude-openrouter --model qwen/qwen3.7-max --effort xhigh --worktree /home/codex/repos/ns004-sagasend`
