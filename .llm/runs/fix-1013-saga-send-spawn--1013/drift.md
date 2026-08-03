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

## 2026-08-03 — Owner-authorized PLAN-EVAL waiver

- **What:** The owner explicitly waived the blocked PLAN-EVAL gate for this slice and authorized
  implementation to proceed.
- **Source:** Owner message in the product thread beginning “Plan-Gate is waived for this slice.”
- **Expected:** A separate open-model Qwen session returns `PASS` before implementation.
- **Actual:** The evaluator credential is deliberately unavailable while #1087 remains open because
  the launched evaluator can autonomously spawn prohibited closed-model helpers. The owner acted as
  an opposite-family Claude reviewer of the Codex-authored plan and waived only this Plan-Gate.
- **Severity:** significant
- **Action:** accept
- **Evidence:** Owner states the generator≠reviewer invariant holds and cites the same release waiver
  precedent used by PR #1075. This does not self-certify implementation or waive IMPL-EVAL.

## 2026-08-03 — Formal IMPL-EVAL transport remains credential-blocked

- **What:** After implementation and aggregate local gates, the canonical Qwen IMPL-EVAL route
  could not launch.
- **Source:** `agentic:provider-canary` for the bound formal-evaluation route.
- **Expected:** A separate Qwen evaluator independently runs gates and writes `evaluate.md`.
- **Actual:** The canary returned `status: blocked`, `auth_required`, `credential: absent`, zero
  tool/reasoning/streaming events, and no evaluator process. No paid/closed substitute was used.
- **Severity:** significant
- **Action:** block
- **Evidence:** `deno task agentic:provider-canary --live --profile claude-openrouter --model qwen/qwen3.7-max --effort xhigh --worktree /home/codex/repos/ns004-sagasend` exited 4 before launch. The PLAN-EVAL waiver does not cover this gate.
