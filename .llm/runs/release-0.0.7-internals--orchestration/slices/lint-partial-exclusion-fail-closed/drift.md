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

## 2026-08-28 — PLAN-EVAL cycle 1 returns specification-gap `FAIL_PLAN`

- **What:** Fresh Tier-A PLAN-EVAL at commit `59b79ccd8` against plan head
  `d437db44d` returned `FAIL_PLAN` on the decisions-locked and open-decision
  checklist boxes.
- **Source:** Evaluator-owned `plan-eval.md` F1-F3 and repair brief
  `1709-plan-repair.md`.
- **Confirmed, not rejected:** adapter shapes, anti-inference rule, probe forms,
  both wrapper refusals, root correction, `allowCount: 7`, lint-only publish
  surface, generator idempotence, exact six-path ceiling, and no seventh path.
- **F1 actual:** only lint has an injectable runner seam. Fmt's private
  `runBatch` directly invokes Deno, so S3 must introduce an equivalent seam
  inside `run-deno-fmt.ts` for malformed-summary/inconsistent-probe units.
- **F2 actual:** Deno emits processed-count summaries on parse-error crash
  batches, but the plan did not lock crash accounting or refusal-vs-crash
  precedence.
- **F3 actual:** default-batch green wording was weaker than evaluator §7's
  per-file proof: corrected lint and root fmt are each `2041/2041/0`, exit 0
  (fmt findings 0).
- **Severity:** material specification repair; no architecture or scope change
- **Action:** lock refusal ≥ crash ≥ ordinary finding; evaluate coverage on
  crash batches; specify exact crash+drop/crash-only JSON and exit at 1/2/200;
  add the fmt seam to S3; demand exit 0 and per-file root gates. Fold A1-A3:
  lint input omission, fmt write `--check` probes, and CRLF fixtures.
- **Bounds:** author-owned harness artifacts only. Preserve `plan-eval.md`; no
  implementation, seventh path, central-state edit, evaluator/runtime lease, or
  N/A gate request.
- **Next:** commit/push immutable repaired head and update draft PR #1710. Cycle
  2 is prepared externally but not granted or launched by this author.
