# PR-F #1566 Context Pack

## Objective

Make the ready-for-review IMPL-EVAL status cleanup read live labels and tolerate only the specific
missing-label 404 race, while preserving generation deduplication and the single-status taxonomy.

## Current state

- Branch is based on `e67c1ba13` (`origin/main`).
- The supplied implementation brief is committed at `fe1d3b5e8` and pushed.
- Live issue #1566 has six acceptance boxes; PR evidence must map them with `box-index: 1..6`.
- Draft PR #1567 is open with `type:fix`, `area:tooling`, `priority:p2`, `status:impl`, and milestone
  `0.0.6`; it remains draft.
- The S1 test file defines the extracted module contract, race regression, narrow 403/unrelated-404
  failures, terminal single-status state, and a guard for the unchanged generation-dedup ordering.
- S2 implementation and all functional/static gates are green. The asset generator produced no
  generated-file drift; a final post-commit clean status remains to capture before handoff.
- Orchestrator review found that bookkeeping failures could still abort dispatch and that this PR
  cannot bootstrap the trusted-base module on its own ready event. The labeled evaluation path is
  orchestrator-owned; the review-fix slice makes checkout/transition failures non-blocking and
  attributed without weakening the trusted-base boundary.
- Review-fix commit `7170d574b3` is pushed. Gates are green: 66 script tests plus scoped
  check/lint/format, YAML parsing, and post-commit asset generation with an empty working tree.
- The PR body and S3 phase comment state the box-1 interpretation and bootstrap limitation. PR
  #1567 remains draft with exactly `status:impl` and milestone `0.0.6`.

## Locked boundaries

Only the phase-eval workflow, `.github/scripts/`, and this slice directory may change. Do not alter
dispatch deduplication, triggers, conditions, model/trusted-base logic, #1564, or PR #1541. Do not
merge or mark the PR ready.

## Next action

Orchestrator substantively reviews the terminal slice and uses the labeled path for separate-session
IMPL-EVAL. This implementation agent must not mark ready, trigger evaluation, or merge.
