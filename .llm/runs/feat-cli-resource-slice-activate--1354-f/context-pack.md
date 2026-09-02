# Context Pack: Slice F activation (#1354)

## Run Metadata

| Field          | Value                                             |
| -------------- | ------------------------------------------------- |
| Run ID         | `feat-cli-resource-slice-activate--1354-f`        |
| Branch         | `feat/cli-resource-slice-activate`                |
| Current phase  | `complete`                                        |
| Archetype      | `6 — CLI / Tooling`                               |
| Scope overlays | frontend consumer output; runtime/hosted excluded |

## Current State

The integration branch contains #1664, Slice A, and Slice E. The owner amended Slice F after the
mandated stop found `agent-conventions.ts` as an additional rendered consumer; item 33 and ceiling
33 govern the run. Implementation and the separate-session Fable evaluation are complete. The
committed verdict is `PASS_IMPL_WITH_FINDINGS`; closeout resolved M-1 through corrected **33
enumerated + 1 absorbed** accounting and M-2 through the canonical doctrine debt registry. The
branch is converged on #1664 head `31d59a656`, all required post-merge gates pass, and no product
feature code changed during closeout.

## Completed

- Complete 18-template retire-set plus manual route seed removed.
- Init and command share the planner, neutral assets, and generated-source formatter.
- Fresh derives manifest/routes after route emission; exact init-preset command rerun is
  conflict-free and byte-identical.
- `generate resource` is registered fourth through production-composed dependencies.
- Focused 32/32 and full CLI 1324/1324 test suites pass; structured check/lint/fmt and precommit
  fitness gates pass.
- Clean-tree MCP regeneration produced no diff; all four carrier/publish/sample checks pass.
- PR #1956 body and implementation-phase PASS comment carry the amended contract and evidence.
- Fresh native Claude/Fable 5 medium evaluator session `bb222ada` independently reproduced the
  load-bearing gates and returned PASS.

## In Progress

- Final harness evidence commit, push, and PR #1956 body/status update.

## Next Steps

1. Push the converged head to `feat/cli-resource-slice-activate`.
2. Update PR #1956 with corrected accounting, debt ownership, and convergence evidence.
3. Hand off Slice G guidance/hosted acceptance.

## Key Decisions

| Decision                       | Source           | Notes                                |
| ------------------------------ | ---------------- | ------------------------------------ |
| One planner/template authority | locked D4/F      | Init preset is exactly form+partial. |
| Fresh derivation after routes  | locked D5/F      | Manual seeds are retired.            |
| Partial issue reference        | MEDIUM-3 / owner | `Refs #1354`; Slice G remains.       |

## Files Changed

- Scope accounting: **33 amended-F enumerated paths + 1 absorbed Slice E path**.
- Of the 33 enumerated paths, 32 changed; item 24's MCP corpus regenerated deterministically with no
  diff.
- The absorbed path is `public-command-dependencies.ts`, Slice E's deferred item-6 production
  composition seam. It makes the pre-convergence product diff 33 files but is not part of Slice F's
  enumeration.
- Post-product package changes are base-derived only: excluding `*.generated.ts`,
  `8c27ffe16..a042c6e57` is 19 files, 1,548 insertions, and 415 deletions, exactly the 19
  non-Slice-E paths supplied by #1664's current base.

## Gates

| Gate family | Current status | Evidence                                                                                                                                                                                                                      |
| ----------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Static      | pass for slice | CLI check 0 diagnostics; 12 authored-file lint/fmt 0 findings. Full-package diagnostics expose only baseline drift: lint 59 occurrences / 34 paths and format 214 findings / 214 paths, with zero changed-path intersections. |
| Fitness     | pass           | JSR audit, publish dry-run, `arch:check`, and `quality:gate` exit 0.                                                                                                                                                          |
| Runtime     | N/A            | Slice G owns hosted acceptance.                                                                                                                                                                                               |
| Consumer    | pass           | focused 32/32; full CLI 1324/1324; all carrier/publish/sample/docs gates pass.                                                                                                                                                |

Post-convergence rerun: CLI check 980 files / 9 batches / 0 diagnostics; full CLI unit suite 1,720
passed / 0 failed / 0 ignored; all asset/corpus/Aspire checks exit 0; `arch:check` and
`quality:gate` exit 0; README fences retain 7 expected type errors; JSDoc examples retain
`unboundName=116`; workspace publish dry-run exits 0.

## Open Questions

- None for Slice F. Slice G owns guidance wording and hosted acceptance.

## Drift and Debt

- Drift: RTK absence, stacked-base movement, and the item-33 rescope are recorded.
- Baseline: whole-package lint/format diagnostics fail outside the Slice F diff; exact counts and
  zero-intersection proof are recorded in `worklog.md`/`drift.md`.
- Debt: `cli-resource-composition-io-1354` in `.llm/harness/debt/arch-debt.md` owns extraction of
  the stager/procedure probe into `kernel/adapters/` and the deferred Slice E LOW-2 exit-error
  normalization.

## Commits

- `e371dda91` — harness bootstrap.
- `8c27ffe16` — reviewed Slice F implementation and pre-evaluation evidence.
- `de042d23e` — clean-tree gate evidence and evaluator handoff.
- `e78b9a25a` — IMPL-EVAL finding bookkeeping and canonical doctrine debt.
- `a042c6e57` — merge current #1664 base `31d59a656`, including generated refresh and dual-receipt
  conflict resolution.
