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

Slices 1–3 are committed/pushed on draft PR #1743. Slice 4 is green locally: the E2E registry debt
split is complete, listener `healthReports` wait assertions and the Phase-B recovery fixture are
registered, and `scaffold.plugins` passes without starting an AppHost. `PLAN-EVAL: N/A` is justified
by the ratified locked issue; the Fable supervisor retains slice review and IMPL-EVAL.

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
- Committed/pushed slice 2 as `feb1e7aadcf4f875cbcd2b878161c3ba9a5d705a` with its PR trail.
- Regenerated the embedded asset barrel and proved deterministic reproduction plus scoped type
  checking.
- Split the 812-line runtime registry into lifecycle/behavior/script concerns and grouped runtime
  probes, reducing `runtime-gates.ts` to 305 lines and direct scaffold files from 48 to 43.
- Added describe-derived checks for `<resource>_listener`/`<resource>_resp` object-valued reports.
- Registered (without running) the lease-backed stop → Unhealthy → exit 18 → start → Healthy
  recovery fixture and JSON receipt path.
- Passed 46 focused E2E tests and the 17-gate `scaffold.plugins` suite.

## In Progress

- Slice 4 commit/push and draft PR trail update.

## Next Steps

1. Commit/push slice 4 and update the stacked draft PR.
2. Draft the S6b issue and #1366/#863 coordination comments.
3. Run the final Phase-A gate matrix and commit/push the run artifacts.

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
| `packages/cli/src/kernel/assets/embedded.generated.ts` | changed | Regenerated helper asset literal. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | slices 1–4 green | structured test/check; raw config-excluded lint; asset reproduction |
| Fitness | slices 1–4 green | per-slice `quality:scan`, `arch:check` exit 0 |
| Runtime | NOT_RUN | no Phase-A lease |
| Consumer | green | `scaffold.plugins` 17/17; AppHost/runtime deliberately not run |

## Open Questions

- None blocking Phase A.

## Drift and Debt

- Drift: current Deno KV arm lacks the assumed existing HTTP health check.
- Debt response: S6 satisfied the next-gate split condition; residual direct-child debt remains
  visible at 45 immediate scaffold children (43 files plus two role directories).

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
