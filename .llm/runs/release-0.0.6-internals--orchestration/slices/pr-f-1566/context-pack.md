# PR-F #1566 Context Pack

## Objective

Make the ready-for-review IMPL-EVAL status cleanup read live labels and tolerate only the specific
missing-label 404 race, while preserving generation deduplication and the single-status taxonomy.

## Current state

- Branch is based on `e67c1ba13` (`origin/main`).
- The supplied implementation brief is committed at `fe1d3b5e8` and pushed.
- Live issue #1566 has six acceptance boxes; PR evidence must map them with `box-index: 1..6`.
- No source or test changes have landed yet.

## Locked boundaries

Only the phase-eval workflow, `.github/scripts/`, and this slice directory may change. Do not alter
dispatch deduplication, triggers, conditions, model/trusted-base logic, #1564, or PR #1541. Do not
merge or mark the PR ready.

## Next action

Commit and push this artifact bootstrap, open/configure the draft PR, then land tests as a separate
RED commit before implementing the fix.

