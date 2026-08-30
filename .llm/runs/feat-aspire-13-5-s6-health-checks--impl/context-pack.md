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

Harness bootstrap and slice 1 are committed/pushed on draft PR #1743. Slice 2 generator emission is
green locally after a RED gate. `PLAN-EVAL: N/A` is justified by the ratified locked issue; the
Fable supervisor retains slice review and IMPL-EVAL.

## Completed

- Read all requested skills/workflow/doctrine/API/S2 evidence and target code.
- Confirmed branch/worktree/base and no pre-existing edits.
- Selected Archetype 6 and the required gate set.
- Added generated-template TCP/RESP helper tests RED→green (8 passed).
- Added one-socket helper implementation with 2000 ms timeout and exact result data.
- Committed/pushed slice 1 as `54fdf19fe735fea793e3548825bd3f3015044461` and opened the correctly
  stacked draft PR with its implementation trail.
- Added per-kind TCP/RESP registration, live endpoint projection, attachment, non-emission, and
  credential-isolation tests; the combined focused suite passes 53 results.

## In Progress

- Slice 2 commit/push and draft PR trail update.

## Next Steps

1. Commit/push slice 2 and update the stacked draft PR.
2. Regenerate and verify the snapshot/asset barrel for slice 3.

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
| `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts` | changed | Per-kind custom check registration and resource attachment. |
| `packages/cli/src/kernel/templates/aspire/helpers/tests/generate-register-infrastructure_test.ts` | changed | Exact emission and credential-boundary tests. |
| `packages/cli/src/kernel/templates/aspire/helpers/tests/generators-config-infra_test.ts` | changed | Updated import composition expectation. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | slices 1–2 green | structured test/check; raw config-excluded lint |
| Fitness | slices 1–2 green | per-slice `quality:scan`, `arch:check` exit 0 |
| Runtime | NOT_RUN | no Phase-A lease |
| Consumer | pending | implementation not started |

## Open Questions

- None blocking Phase A.

## Drift and Debt

- Drift: current Deno KV arm lacks the assumed existing HTTP health check.
- Debt: `scaffold-runtime-a8-f16-1333` requires the E2E split before the listener gate.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
