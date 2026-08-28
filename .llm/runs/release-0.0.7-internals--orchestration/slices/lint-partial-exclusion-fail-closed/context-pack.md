# Context Pack: #1709 lint/fmt partial-exclusion fail-closed

## Run Metadata

| Field          | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| Run ID         | `release-0.0.7-internals--orchestration/slices/lint-partial-exclusion-fail-closed` |
| Branch         | `fix/lint-partial-exclusion-fail-closed`                                           |
| Current phase  | cycle-1 `FAIL_PLAN` repair; cycle 2 not granted; implementation blocked            |
| Archetype      | `6-cli-tooling`                                                                    |
| Scope overlays | none                                                                               |
| Author thread  | `01a047f0-f17e-7692-b6f0-83a6d22888c9`                                             |
| Baseline       | `cf648f1ff973d74c213bb125a6f5f5b9328e693b`                                         |

## Current state

PLAN-EVAL cycle 1 returned `FAIL_PLAN` at evaluator commit `59b79ccd8` against
plan head `d437db44d`. It was a specification-gap verdict: the evaluator
confirmed the six-path architecture, adapter signals, shared identity design,
refusal cases, root doctor correction, lint-only publish consequence, generator
idempotence, `allowCount: 7`, and no-seventh-path bound.

The authorized repair closes all three findings without implementation:

- F1: S3 now explicitly introduces the missing injectable fmt runner seam inside
  `run-deno-fmt.ts`; malformed-summary and inconsistent-probe tests use that
  seam.
- F2: coverage is evaluated on crash batches and precedence is locked as refusal
  ≥ crash ≥ ordinary finding. Crash+drop and crash-only exit/JSON/diagnostic
  outcomes are exact at batch sizes 1, 2, and 200.
- F3: root lint and fmt must both exit 0, with per-file drop-free gates using
  the evaluator §7 baselines (`2041/2041/0` for each; fmt findings 0).

All advisories are folded: lint `--input` omits `coverage`; fmt write mismatch
probes use non-mutating `--check`; both adapter suites pin CRLF summaries. No
product/tool/config/workflow/generated source has changed. The implementation
ceiling remains exactly six paths, with no seventh path.

## Completed

- Preserved evaluator-owned `plan-eval.md` unchanged and retained cycle-1
  history.
- Corrected the false fmt-seam premise in plan, design, and S3 gates.
- Defined crash-batch coverage accounting, exact precedence, and invariant JSON.
- Strengthened S1/S2/S3 with batch-size-1 root evidence and row 8 with exit 0
  for both root tasks.
- Folded A1, A2, and A3 explicitly.
- Kept the frozen proving gates and all N/A surfaces unchanged.

## In progress

- Commit/push the author-owned repair artifacts and update draft PR #1710.

## Next steps

1. Author stops after publishing the immutable repair head and PLAN repair
   comment.
2. Coordinator reconciles that head; cycle-2 PLAN-EVAL is not launched or
   requested by the author.
3. Only after a later PLAN-EVAL PASS and separate coordinator authorization may
   implementation begin in S1 → S2 → S3 → S4 order.
4. Any seventh implementation path requires another explicit rescope.

## Key decisions

| Decision                                     | Source             | Notes                                           |
| -------------------------------------------- | ------------------ | ----------------------------------------------- |
| Fmt injectable runner is introduced in S3.   | cycle-1 F1         | Same file; no seventh module.                   |
| Refusal ≥ crash ≥ ordinary finding.          | cycle-1 F2         | Refusal exits 2; crash diagnostics remain once. |
| Crash batches participate in coverage.       | evaluator evidence | Deno emits completion counts on parse errors.   |
| Root lint and fmt must both remain exit 0.   | cycle-1 §7 / F3    | Per-file baselines prove drop-free selection.   |
| A1 folded: lint `--input` omits coverage.    | advisory           | No selection identity exists in saved-log mode. |
| A2 folded: fmt write probes use `--check`.   | advisory           | Non-mutating classification.                    |
| A3 folded: CRLF fixtures in both parsers.    | advisory           | Cheap Windows-runner insurance.                 |
| Publish and generated hash remain lint-only. | rescope brief      | Fmt has no consumer body/API claim.             |

## Gates

| Gate family                   | Current status                    | Evidence / bound                                                         |
| ----------------------------- | --------------------------------- | ------------------------------------------------------------------------ |
| PLAN-EVAL cycle 1             | `FAIL_PLAN`, preserved            | evaluator commit `59b79ccd8`; F1-F3 specification gaps                   |
| Plan repair                   | authoring / publication           | `plan.md`, `research.md`, `worklog.md`, `context-pack.md`, `drift.md`    |
| PLAN-EVAL cycle 2             | NOT_GRANTED / NOT_LAUNCHED        | coordinator reconciles repaired immutable head first                     |
| Frozen proving gates          | NOT_RUN for implementation        | `check`, `test`, `publish-dry-run`, `quality-job`, `check:assets-barrel` |
| Root drop-free baseline       | PASS in evaluator scratch archive | lint `2041/2041/0`; fmt `2041/2041/0`, findings 0; both exit 0           |
| Quality                       | NOT_RUN for implementation        | `allowCount` must remain 7                                               |
| Runtime/E2E/docs-site/MCP JSR | N/A                               | no evaluator/runtime lease; no scaffold/Aspire/Docker/browser/E2E        |

## Open questions

- Must resolve now: none after F1-F3 repair.
- Safe to defer: local helper/type/function names only.

## Drift and debt

- Drift: cycle-1 specification gaps and their bounded repair are appended in
  `drift.md`; architecture/scope were not rejected.
- Debt: no new architecture debt; existing CLI warnings/doc debt remain
  baseline.

## Commits

- Original plan: `f01c1fb593312926d24ad226c45a25f206d772db`.
- Six-path amended plan: `d437db44d40d4dd3e7149ebf98187f3d3fcbb53c`.
- Cycle-1 evaluator verdict: `59b79ccd899ab02a2377e48bba2fdf9dbc866200`.
- Repaired plan head: pending author commit/push; PR #1710 head and phase
  comment become the authority. No implementation commit exists.
