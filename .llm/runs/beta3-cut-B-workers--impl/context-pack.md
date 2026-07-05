# Context Pack: workers health entrypoint #376

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `beta3-cut-B-workers--impl` |
| Branch | `fix/workers-health-entrypoint-376` |
| Current phase | `implement` |
| Archetype | `5 - Plugin Package` |
| Scope overlays | `none` |

## Current State

The branch started clean at `eab02889`. The implementation now registers the built-in workers health job with `sourceUrl: "jsr:@netscript/plugin-workers/jobs/health-check.ts"` while retaining `entrypoint: "./jobs/health-check.ts"` as the package-local fallback/display path. Tests prove registry repair and core dynamic import source selection.

## Completed

- Required skills and doctrine/harness references read.
- Research, plan, design, and drift initialized.
- Fix option selected: published JSR package module via `sourceUrl`.
- Source changes and targeted gates completed.

## In Progress

- Commit, push, PR creation, and PR implementation comment.

## Next Steps

1. Commit the slice and update `commits.md`.
2. Push with `git push origin HEAD:refs/heads/fix/workers-health-entrypoint-376`.
3. Open the PR against `main`, apply labels/milestone, and post implementation evidence.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Use option 1 / package `sourceUrl` | `plan.md` D1 | Avoids plugin source copy and inline duplication. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/beta3-cut-B-workers--impl/*` | new | Harness artifacts. |
| `plugins/workers/services/src/init.ts` | changed | Built-in job constants, package `sourceUrl`, stale-row repair. |
| `plugins/workers/services/src/init_test.ts` | new | Registration and stale repair tests. |
| `packages/plugin-workers-core/tests/runtime/job-dispatcher_test.ts` | new | Dynamic import uses `sourceUrl` before `entrypoint`. |
| `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts` | changed | Runtime E2E gate now requires completed health-check execution. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | pass | scoped check/lint/fmt wrappers on touched roots |
| Fitness | pass | targeted Deno tests and workers publish dry-run |
| Runtime | partial pass | unit execution source coverage; full scaffold runtime not run |
| Consumer | partial pass | E2E gate source strengthened; full smoke deferred |

## Open Questions

- None blocking.

## Drift and Debt

- Drift: implementation-lane prompt bypassed separate PLAN-EVAL; recorded in `drift.md`.
- Debt: no new architecture debt expected.

## Commits

- Also tracked in `commits.md` per coordinator prompt.
