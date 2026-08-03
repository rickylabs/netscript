# Drift Log: saga engine correctness

## 2026-08-03 — Redis hang did not reproduce, atomic contract failure did

- **What:** The reported indefinite wait was not observed against owned Redis 7, Garnet 1.1.1, the
  auto-detected shared runtime, or published 0.0.3. A concurrent CAS probe deterministically
  admitted all 16 competing writers.
- **Source:** Real-server probes in ignored `.llm/tmp/repro-1064-*.ts`.
- **Expected:** `KvSagaStore.save` would stop at Redis atomic commit.
- **Actual:** Sequential saves complete; connection-shared `WATCH` does not protect concurrent
  atomic operations.
- **Severity:** significant
- **Action:** fix
- **Evidence:** `repro-1064-concurrent-cas.ts` output: `fulfilled: 16`, `rejected: 0`, final
  writer 16.

## 2026-08-03 — Canonical capability page path differs from addendum

- **What:** `docs/site/capabilities/durable-sagas.md` is absent; the routed `cap:durable-sagas` page
  is `docs/site/durable-workflows/sagas.md`.
- **Source:** docs tree and xref search.
- **Expected:** Edit the supervisor-named capabilities path.
- **Actual:** Acceptance must update the existing canonical page and storefront tutorial.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `rg -n "cap:durable-sagas" docs/site` and both existing pages.

## 2026-08-03 — Local PLAN-EVAL transport is credential-blocked

- **What:** The canonical local Claude Code + OpenRouter evaluator could not launch because the
  selected provider credential is absent.
- **Source:**
  `deno task agentic:provider-canary --live --profile claude-openrouter --model
  qwen/qwen3.7-max --effort high --worktree /home/codex/repos/ns004-sagas`.
- **Expected:** A separate Qwen evaluator session writes `plan-eval.md` before implementation.
- **Actual:** The agentic canary returned exit 4, `status: blocked`, diagnostic `auth_required`; no
  evaluator session was created.
- **Severity:** significant
- **Action:** rescope
- **Evidence:** The provider canary reports `credential: absent`. Cloud OpenHands is prohibited for
  this local run by the OpenHands routing skill.
