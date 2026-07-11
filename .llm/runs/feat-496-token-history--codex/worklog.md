# Worklog: token-budget history strategy

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-496-token-history--codex` |
| Branch | `feat/496-token-budget-history` |
| Archetype | `4 - Public DSL / Builder` |
| Scope overlays | `none` |

## Design

### Public Surface

- `TokenEstimator`, `TokenBudgetHistoryOptions`, and `tokenBudgetHistory` from `@netscript/ai/agent`.

### Domain Vocabulary

- `TokenEstimator` — pluggable per-message estimate for real tokenizer integration.
- `TokenBudgetHistoryOptions` — required non-negative budget and optional estimator.

### Ports

- No new port. The pure estimator callback is the exercised testability/extension seam.

### Constants

- No finite domain-value constants are needed; the chars-per-token ratio is local default behavior.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Prove the additive public token-budget strategy and edge semantics | focused unit tests, scoped static gates, doc-lint, publish dry-run | `packages/ai/src/agent/history.ts`, `packages/ai/agent.ts`, `packages/ai/tests/agent_loop_test.ts`, run artifacts |

### Deferred Scope

- Provider tokenizer adapters and paired-turn grouping — separate features beyond #496.

### Contributor Path

Read `src/agent/history.ts`, implement another pure `HistoryStrategy`, export it through `agent.ts`,
and copy the focused history tests in `tests/agent_loop_test.ts`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-11 | 1 | Plan | Re-baselined at required SHA; owner-waived PLAN-EVAL recorded before implementation. |
| 2026-07-11 | 1 | Implement | Added public strategy/types/export and five acceptance-focused tests. |
| 2026-07-11 | 1 | Reconcile | Issue #496 remains open; no PR/comment action allowed by brief; scope and taxonomy unchanged. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Preservation wins for over-budget leading systems | Explicit issue acceptance contract | issue #496 / plan D4 |
| Contiguous newest suffix | Avoid holes in conversation history | plan D3 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| PLAN-EVAL owner-waived | minor/process | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Package tests | `deno task test` in `packages/ai` | PASS | 94 passed, 0 failed. |
| Scoped check | `run-deno-check.ts --root packages/ai --ext ts,tsx` | PASS | 77 files, 0 occurrences. |
| Scoped lint | `run-deno-lint.ts --root packages/ai --ext ts,tsx` | PASS | 77 files, 0 occurrences. |
| Scoped format | `run-deno-fmt.ts --root packages/ai --ext ts,tsx` | PASS | 77 files, 0 findings. |
| Doc lint | `deno task doc:lint --root packages/ai --pretty` | PASS | Full 12-entry export map; 0 combined errors. |
| Publish dry-run | `deno task publish:dry-run` in `packages/ai` | PASS | No slow-type errors; pre-existing MCP dynamic-import warnings only. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-1..F-19 applicable set | PASS | `deno task arch:check` | `packages/ai`: FAIL=0 WARN=0 INFO=0. Repository warnings are pre-existing/outside this slice. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Runtime/Aspire | N/A | Pure strategy | No runtime/resource behavior changed. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `@netscript/ai/agent` | PASS | scoped check, doc-lint, publish dry-run | Public export resolves without export-map change. |

## Handoff Notes

- Evaluator should inspect tiny-budget preservation and estimator normalization first. Automated
  gates are green; separate-session slice review/IMPL-EVAL remains orchestrator-owned.
