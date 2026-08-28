# Context Pack: #1709 lint/fmt partial-exclusion fail-closed

## Run Metadata

| Field          | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| Run ID         | `release-0.0.7-internals--orchestration/slices/lint-partial-exclusion-fail-closed` |
| Branch         | `fix/lint-partial-exclusion-fail-closed`                                           |
| Current phase  | owner-accepted F4 plan amendment after cycle-2 `FAIL_PLAN`; implementation blocked |
| Archetype      | `6-cli-tooling`                                                                    |
| Scope overlays | none                                                                               |
| Author thread  | `01a047f0-f17e-7692-b6f0-83a6d22888c9`                                             |
| Baseline       | `cf648f1ff973d74c213bb125a6f5f5b9328e693b`                                         |

## Current state

PLAN-EVAL cycle 1 returned `FAIL_PLAN` at evaluator commit `59b79ccd8` against
plan head `d437db44d`. The repair closed F1-F3 and folded A1-A3. PLAN-EVAL cycle
2 then returned `FAIL_PLAN` at evaluator commit `f2b3fc8b3` on one narrow
extension, F4. It explicitly closed F1, F3, A1-A3, and all of F2 except the fmt
write-mode crash signal. The ordinary two-cycle allowance is exhausted; the
owner accepted the recommended bounded F4 fix and there is no third PLAN-EVAL.

The standing repaired decisions remain unchanged:

- F1: S3 now explicitly introduces the missing injectable fmt runner seam inside
  `run-deno-fmt.ts`; malformed-summary and inconsistent-probe tests use that
  seam.
- F2: coverage is evaluated on crash batches and precedence is locked as refusal
  ≥ crash ≥ ordinary finding. Crash+drop and crash-only exit/JSON/diagnostic
  outcomes are exact at batch sizes 1, 2, and 200.
- F3: root lint and fmt must both exit 0, with per-file drop-free gates using
  the evaluator §7 baselines (`2041/2041/0` for each; fmt findings 0).

All advisories A1-A3 remain folded: lint `--input` omits `coverage`; fmt write
mismatch probes use non-mutating `--check`; both adapter suites pin CRLF
summaries. F4 adds only the write-scoped
`^error: Failed to format (\d+) of (\d+) checked files?$` completion form,
using the second integer as processed, and write-mode crash-only/crash+drop
controls at 1, 2, and 200. A complete write crash remains exit 1; a simultaneous
coverage refusal exits 2. No product/tool/config/workflow/generated source has
changed. The implementation ceiling remains exactly six paths, with no seventh
path.

## Completed

- Preserved evaluator-owned `plan-eval.md` unchanged and retained cycle-1
  history.
- Corrected the false fmt-seam premise in plan, design, and S3 gates.
- Defined crash-batch coverage accounting, exact precedence, and invariant JSON.
- Strengthened S1/S2/S3 with batch-size-1 root evidence and row 8 with exit 0
  for both root tasks.
- Folded A1, A2, and A3 explicitly.
- Independently measured Deno 2.9.5's ANSI-prefixed write-crash form outside the
  checkout, including singular `1 of 1 checked file` and plural `1 of 2` / `2
  of 3 checked files`, all exit 1.
- Extended the existing fmt adapter and exact crash matrix to write mode without
  changing the common coverage contract or precedence.
- Kept the frozen proving gates and all N/A surfaces unchanged.

## Publication boundary

- The amended plan head is the commit containing this context pack; resolve it
  with `git rev-parse HEAD`. Draft PR #1710 remains the immutable record after
  the explicit-refspec push and phase comment.

## Next steps

1. Author stops after publishing the immutable F4-amended head and PLAN comment.
2. No third PLAN-EVAL is launched or requested. The coordinator runs a fresh
   Tier-A on the exact pushed head.
3. On Tier-A `PASS`, the leaf stops for a separate coordinator implementation
   grant; implementation does not begin in this turn.
4. Any seventh implementation path remains an immediate rescope stop.

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
| F4: third write-crash completion form.       | cycle-2 / owner    | Write-only; use second integer; crash-only stays exit 1. |
| Publish and generated hash remain lint-only. | rescope brief      | Fmt has no consumer body/API claim.             |

## Gates

| Gate family                   | Current status                    | Evidence / bound                                                         |
| ----------------------------- | --------------------------------- | ------------------------------------------------------------------------ |
| PLAN-EVAL cycle 1             | `FAIL_PLAN`, preserved            | evaluator commit `59b79ccd8`; F1-F3 specification gaps                   |
| Plan repair                   | authoring / publication           | `plan.md`, `research.md`, `worklog.md`, `context-pack.md`, `drift.md`    |
| PLAN-EVAL cycle 2             | `FAIL_PLAN`, F4 only               | evaluator commit `f2b3fc8b3`; ordinary allowance exhausted               |
| Owner F4 amendment            | accepted / authored                | third write form plus check/write 1/2/200 controls; no third PLAN-EVAL   |
| Frozen proving gates          | NOT_RUN for implementation        | `check`, `test`, `publish-dry-run`, `quality-job`, `check:assets-barrel` |
| Root drop-free baseline       | PASS in evaluator scratch archive | lint `2041/2041/0`; fmt `2041/2041/0`, findings 0; both exit 0           |
| Quality                       | NOT_RUN for implementation        | `allowCount` must remain 7                                               |
| Runtime/E2E/docs-site/MCP JSR | N/A                               | no evaluator/runtime lease; no scaffold/Aspire/Docker/browser/E2E        |

## Open questions

- Must resolve now: none after the owner-accepted F4 amendment.
- Safe to defer: local helper/type/function names only.

## Drift and debt

- Drift: cycle-1 repair and cycle-2 F4 owner amendment are appended in
  `drift.md`; architecture/scope were not rejected or widened.
- Debt: no new architecture debt; existing CLI warnings/doc debt remain
  baseline.

## Commits

- Original plan: `f01c1fb593312926d24ad226c45a25f206d772db`.
- Six-path amended plan: `d437db44d40d4dd3e7149ebf98187f3d3fcbb53c`.
- Cycle-1 evaluator verdict: `59b79ccd899ab02a2377e48bba2fdf9dbc866200`.
- Cycle-1 repaired plan head: `3e934e2de1ed758f7182ad1eebf027750bcfb976`.
- Cycle-2 evaluator verdict: `f2b3fc8b3bcbf8720e4967bec7a8d31ad42200ad`.
- F4-amended plan head: the commit containing this context pack; PR #1710 head
  and the amendment phase comment are the authority. No implementation commit
  exists.
