# Context Pack: Aspire 13.5 listener-readiness health checks

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-aspire-13-5-s6-health-checks--impl` |
| Branch | `feat/aspire-13-5-s6-health-checks` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

Harness bootstrap, research, plan, design, and drift re-baseline are complete on stacked S5 head
`0bd8ba832`. Slice 1 helper implementation is green locally and ready to commit/push. `PLAN-EVAL:
N/A` is justified by the ratified locked issue; the Fable supervisor retains slice review and
IMPL-EVAL.

## Completed

- Read all requested skills/workflow/doctrine/API/S2 evidence and target code.
- Confirmed branch/worktree/base and no pre-existing edits.
- Selected Archetype 6 and the required gate set.
- Added generated-template TCP/RESP helper tests RED→green (8 passed).
- Added one-socket helper implementation with 2000 ms timeout and exact result data.

## In Progress

- Slice 1 commit/push and stacked draft PR opening.

## Next Steps

1. Commit/push slice 1 and open the stacked draft PR.
2. Continue generator, asset, E2E, and gate slices with per-commit PR comments.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Endpoint values resolve per callback | #1718 / EndpointProperty API | Preserves isolated-start allocation. |
| Credentials never enter probes | #1718 | Only kind/host/port cross the helper boundary. |
| Deno KV unchanged | owner boundary | Missing current HTTP check is recorded drift, not expanded scope. |
| E2E debt split precedes fixture | debt stop condition | No direct-child or monolith deepening. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/feat-aspire-13-5-s6-health-checks--impl/*` | new | Harness bootstrap/research/plan/design/drift. |
| `packages/cli/src/kernel/assets/aspire/helpers/_aspire-compat.ts.template` | changed | TCP/RESP readiness helper runtime edge. |
| `packages/cli/src/kernel/templates/aspire/helpers/tests/aspire-compat-health-checks_test.ts` | new | Generated-template real-socket tests. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | slice 1 green | structured test/check; raw config-excluded lint/fmt |
| Fitness | slice 1 green | `quality:scan`, `arch:check` exit 0 |
| Runtime | NOT_RUN | no Phase-A lease |
| Consumer | pending | implementation not started |

## Open Questions

- None blocking Phase A.

## Drift and Debt

- Drift: current Deno KV arm lacks the assumed existing HTTP health check.
- Debt: `scaffold-runtime-a8-f16-1333` requires the E2E split before the listener gate.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
