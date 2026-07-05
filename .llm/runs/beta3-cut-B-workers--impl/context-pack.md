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

The branch started clean at `eab02889`. The implementation now registers the built-in workers health job with `sourceUrl: "jsr:@netscript/plugin-workers/jobs/health-check.ts"` while retaining `entrypoint: "./jobs/health-check.ts"` as the package-local fallback/display path. The FAIL_FIX responses add the required `./jobs/health-check.ts` export map entry, document the job subpath, test that the sourceUrl-derived subpath remains exported, and generate exact consuming-app import-map entries for the stored `jsr:` sourceUrl so local-source mode resolves the workspace file while JSR mode resolves the pinned package export.

## Completed

- Required skills and doctrine/harness references read.
- Research, plan, design, and drift initialized.
- Fix option selected: package `sourceUrl`, resolved by exact consuming-app import-map keys.
- Source changes and targeted gates completed.
- FAIL_FIX export-map defect fixed and gates rerun.

## In Progress

- Validate, commit the local-source FAIL_FIX response, push, and post PR comment.

## Next Steps

1. Run targeted tests, scoped gates, JSR dry-run/doc checks, and one `scaffold.runtime` smoke.
2. Commit FAIL_FIX response and update `commits.md`.
3. Push with `git push origin HEAD:refs/heads/fix/workers-health-entrypoint-376`.
4. Post `[PHASE: IMPL] [VERDICT: FAIL_FIX-RESPONSE]` PR comment.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Use option 1 / package `sourceUrl` plus exact import-map key | `plan.md` D1/D4 | Avoids plugin source copy and inline duplication while keeping local-source scaffolds off the registry. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/beta3-cut-B-workers--impl/*` | new | Harness artifacts. |
| `plugins/workers/services/src/init.ts` | changed | Built-in job constants, package `sourceUrl`, stale-row repair. |
| `plugins/workers/services/src/init_test.ts` | new | Registration and stale repair tests. |
| `plugins/workers/deno.json` | changed | Adds explicit `./jobs/health-check.ts` export. |
| `plugins/workers/jobs/health-check.ts` | changed | Documents the new public job subpath and exports local structural types. |
| `packages/plugin-workers-core/tests/runtime/job-dispatcher_test.ts` | new | Dynamic import uses `sourceUrl` before `entrypoint`. |
| `packages/cli/src/kernel/adapters/scaffold/import-resolver.ts` | changed | Resolves the health job subpath in local and JSR modes. |
| `packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts` | changed | Adds the exact health job import-map key when installing workers. |
| `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts` | changed | Runtime E2E gate now requires completed health-check execution. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | pass | scoped check/lint/fmt wrappers on touched roots |
| Fitness | pass | targeted Deno tests, raw job entry doc-lint, full export doc-lint wrapper, workers publish dry-run |
| Runtime | pass | unit execution source coverage; full scaffold runtime exit 0, `Summary: passed=48 failed=0` |
| Consumer | pass | E2E gate source strengthened; health job trigger/executions gates passed in scaffold runtime |

## Open Questions

- None blocking.

## Drift and Debt

- Drift: implementation-lane prompt bypassed separate PLAN-EVAL; export-map miss found by IMPL-EVAL; self-referential `jsr:` local-source failure found by merge-readiness E2E; all recorded in `drift.md`.
- Debt: no new architecture debt expected.

## Commits

- Also tracked in `commits.md` per coordinator prompt.
