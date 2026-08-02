# Context Pack: fresh-ui clean-checkout test task

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-990-fresh-ui-test-task--clean-checkout-test` |
| Branch | `fix/990-fresh-ui-test-task` |
| Current phase | `close` |
| Archetype | `4 - Public DSL / Builder` |
| Scope overlays | `none` |

## Current State

Both defects are fixed. The task grants the empirically sufficient read/write/run set, with a
capability comment in the affected test file, and the second test recursively creates the externally constrained
`.llm/tmp` parent. The clean-parent full suite passed all 166 tests without env or net permission.

## Completed

- Research, amended plan/design, implementation, clean-parent full tests, scoped check/lint, and
  publish dry-run.

## In Progress

- Final IMPL-EVAL passed; commit and explicit-refspec push remain.

## Next Steps

1. Commit all run artifacts and the two-file implementation slice.
2. Push only `HEAD:refs/heads/fix/990-fresh-ui-test-task`.
3. Leave PR creation to the owner.

## Files Changed

- `packages/fresh-ui/deno.json` — scoped test permissions and justification.
- `packages/fresh-ui/tests/registry/markdown-renderer.test.ts` — recursive temp-parent creation.
- Harness run artifacts — plan/evidence/drift/evaluator record.

## Gates

- Full tests: PASS — `ok | 166 passed | 0 failed (5m59s)`.
- Scoped check: PASS — 149 files, 0 diagnostics.
- Lint: PASS — 149 files.
- Publish dry-run: PASS on the pre-final-fix tree; the final manifest remains strict JSON, the
  capability rationale lives in the test file, and final-state publish readiness/assets checks pass.

## Drift and Debt

- Drift: owner-constrained gate set and owner-created PR; canonical Qwen evaluator route failed,
  while both evaluator passes used owner-authorized Claude Opus fallback sessions.
- Debt: none created or deepened.
