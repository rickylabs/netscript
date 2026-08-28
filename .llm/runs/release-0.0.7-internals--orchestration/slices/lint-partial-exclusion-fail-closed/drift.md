# Drift Log: #1709 lint partial-exclusion fail-closed

Append-only. The original four-path envelope was widened to exactly six paths by
explicit coordinator rescope; the historical discovery entry remains unchanged
below.

## 2026-08-28 — format wrapper has the analogous mixed-batch false green

- **What:** The mandatory read-only audit proved `run-deno-fmt.ts` also accepts
  a partially excluded mixed batch as green and changes verdict with batch size.
- **Source:** Temporary project with `fmt.exclude: ["generated/"]`, excluded
  unformatted `generated/bad.ts`, and included clean `clean.ts`; current wrapper
  at `.llm/tools/run-deno-fmt.ts:420-602`.
- **Expected:** Supervisor research left fmt untested and the leaf contract
  required a planning audit without authorizing mutation.
- **Actual:** Mixed batch reports `filesSelected: 2`, one batch, zero findings,
  exit 0; identical selection at batch size 1 exits 2. An included-path copy of
  the bad text produces a real format finding and exit 1.
- **Severity:** significant
- **Action:** defer; explicit coordinator rescope is required before any fmt
  source/test mutation.
- **Evidence:** `research.md` findings 9-10 and `worklog.md` planning gate
  table.

## 2026-08-28 — coordinator grants evidence-triggered six-path formatter rescope

- **What:** The coordinator accepted the formatter defect into this same leaf
  and expanded the plan envelope from four to exactly six implementation paths.
- **Source:** Full rescope brief at
  `/home/codex/repos/netscript-007-internals/.llm/runs/release-0.0.7-internals--orchestration/briefs/1709-rescope-six-path.md`.
- **Expected under prior contract:** Finding 9 required an explicit rescope
  decision before any fmt source/test planning or mutation.
- **Actual:** The evidence condition was satisfied. Added planning surfaces are
  only `.llm/tools/run-deno-fmt.ts` and `.llm/tools/run-deno-fmt_test.ts`; the
  four prior paths remain.
- **Severity:** significant / accepted
- **Action:** amend research, design, plan, context, supervisor boundary, thread
  record, and PR #1710 to the six-path contract. Keep implementation blocked
  behind a fresh independent PLAN-EVAL.
- **Publish bound:** `run-deno-fmt.ts` is not a consumer tool. Generated
  text/hash and CLI publish evidence remain lint-driven only.
- **Stop rule:** any seventh implementation path requires another explicit
  coordinator rescope.
- **Evidence:** `research.md` findings 9-13, `plan.md` exact surface and ordered
  S1-S4, and amended worklog signal controls.
