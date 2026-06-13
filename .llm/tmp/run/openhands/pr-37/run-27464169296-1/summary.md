# OpenHands PR #37 Evaluation Summary — Plan-Eval #3 (5d4-streaming)

## Summary

Independent PLAN-EVAL session (`run-27464169296-1`) for the 2→3 revision cycle of
**Wave 5d sub-gate 4/6: `./defer` + `./streams`** (PR #37). I did not write the plan;
I am evaluating the binding plan at
`.llm/tmp/run/feat-package-quality-wave5-apps--5d4-streaming/plan.md` plus
`research.md`, `design.md`, `drift.md`, `context-pack.md`, and the committed
`deno-doc-lint*` / `jsr-*` artifacts, against `plan-protocol.md`,
`plan-gate.md`, and `archetype-gate-matrix.md`.

Verdict: **FAIL_PLAN**. Three of the four prior blockers remain unresolved. Clock-port
blocker (`L-5d4-7`) is RESOLVED per supervisor decision.

## Changes

One file committed to branch `feat/package-quality-wave5-apps-5d4-streaming`:

- `.llm/tmp/run/feat-package-quality-wave5-apps--5d4-streaming/plan-eval.md`
  (commit `c45b256`).

No edits to `plan.md`, `design.md`, `research.md`, or `drift.md`. Evaluation only.
No implementation, no merging, no `@openhands-agent` blocks emitted.

## Blocker-by-blocker findings

### Blocker 1 — Archetype-3 gate coverage (18 required fitness gates) → **FAIL**

The gate matrix requires 18 fitness gates for Archetype 3. The binding `plan.md`
`§Fitness Gates` table maps only **8 of 18**:
F-2, F-3, F-5, F-7, F-9, F-13, F-14, F-15.

**10 required gates are unmapped with no N/A rationale:**
F-1 (File-size lint), F-4 (Inheritance audit), F-6 (JSR publishability —
critical: see Blocker 3), F-8 (Workspace lib check), F-10 (Test-shape audit),
F-11 (Forbidden-folder lint), F-12 (Naming-convention lint), F-16
(Folder-cardinality), F-17 (Abstract-derived co-location), F-18 (Sub-barrel lint).

The plan's listed 8 F-series gates do **not** satisfy the archetype's required
set. Other gate families (Static, Runtime/Aspire, Consumer) are also only
partially addressed.

### Blocker 2 — Doc-lint budget (113 errors) → **FAIL**

- `doc-lint-raw.txt` confirms **113** errors (final line: `error: Found 113 documentation lint errors.`).
- Plan.md's "Hidden Scope" mentions "budget one slice for doc lint sweep" (line 67) —
  **generic wording, no arithmetic**.
- Slice 1 ("Surface type fixes") targets only 2 files (`DeferPage.tsx`,
  `stream-error-boundary.tsx`) and cannot absorb 113 errors on its own.
- **No arithmetic reconciliation** assigning the 113 errors to named buckets
  across slices was found anywhere in `plan.md`.
- `drift.md` §D-5d4-10 cross-references a phantom plan section
  `§Doc-Lint Budget Reconciliation (Slice 6 bucket)` — the section does not
  exist in `plan.md` (which has only 8 slices, and Slice 6 =
  "Permission / README update").
- Doc-lint is effectively handled only by a **generic sweep reference**, not
  by named buckets with sums reconciled against committed artifacts.

### Blocker 3 — jsr-audit publishability scan → **FAIL (partial)**

- **Dry-run was actually RUN** and results committed in four artifacts:
  `jsr-dry-run-raw.txt`, `jsr-publish-dry-run-5d4.txt`,
  `jsr-publish-dry-run-5d4-local.txt`, `jsr-dry-run-package-fresh.txt`.
  The final-line count is `62 problems` (≈54 excluded-module + 8 slow-types).
- **However:** `F-6` (JSR publishability, **required** for Arch 3) is **absent**
  from the `plan.md` Fitness Gates table; no `§JSR-audit` section exists; no
  finding-to-slice assignment. The 54 `excluded-module` errors and the 8 slow
  types are not triaged as in-5d4-scope vs N/A/accepted-debt (the
  `form/` and `query/` slow-type findings logically belong to sub-gates 5d2/5d5/5d6,
  but this is not stated in `plan.md`).
- `drift.md` §D-5d4-8 and §D-5d4-9 reference **phantom locked decisions
  L-5d4-8 and L-5d4-9**, a **phantom Slice 9**, and a **phantom plan section
  §JSR-Audit / Over-Cap Budget Reconciliation** — none of which exist in the
  binding `plan.md` (which stops at L-5d4-7 and has 8 slices). The generator
  appears to have prepared supporting drift entries for plan content that was
  never committed.

### Clock-port blocker (prior #4) → **RESOLVED**

`L-5d4-7` (fake-timer helper local to `packages/fresh`) is supervisor-locked
and present in `plan.md` line 81. Accepted without further concern.

## Validation

Static analysis only; no implementation touched:
1. `cat .llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` — umbrella plan.
2. `cat .llm/tmp/run/feat-package-quality-wave5-apps--5d4-streaming/plan.md` — sub-plan.
3. `cat .llm/harness/gates/archetype-gate-matrix.md` — 18 required Arch-3 gates confirmed.
4. `cat .llm/harness/evaluator/plan-protocol.md` + `gates/plan-gate.md` — checklist applied.
5. `grep` counts on `doc-lint-raw.txt` (113 errors), `jsr-publish-dry-run-5d4.txt`
   (58 excluded-module + 8 missing-return-type + 2 slow-type = 62/68).
6. Cross-reference of `drift.md` citations (`§JSR-Audit…`, `§Doc-Lint Budget…`,
   `L-5d4-8`, `L-5d4-9`, "Slice 9") → all **not found** in `plan.md`.

## Responses to review comments / issue comments

Trigger comment requested evaluation only (no code edits, no `@openhands-agent`
block, no direct GitHub comment). Findings are captured in `plan-eval.md` for
the workflow to comment on PR #37.

## Remaining risks

1. **Artifact-consistency defect.** The binding `plan.md` and `drift.md` are
   internally inconsistent — drift entries cite plan content that does not
   exist. Either the plan must be extended to include the content drift
   describes (§JSR-Audit, §Doc-Lint Budget Reconciliation, L-5d4-8, L-5d4-9,
   Slice 9), or the drift entries must be rewritten to match the actual plan.
   This is a generator-side coherence issue, not an evaluator-solvable one.
2. **Escalation path.** `plan-protocol.md` states "Two `FAIL_PLAN` cycles are
   allowed. After the second, escalate to the user with the unresolved items."
   This is the third cycle (prior evals deleted on branch but referenced in
   commits). If a fourth `FAIL_PLAN` is returned, the user must be informed
   directly.
3. **Scope leak across sub-gates.** The JSR `form/` and `query/` slow-type
   findings logically belong to 5d2 and 5d5/5d6. If 5d4 is forced to absorb
   them, the umbrella plan's sub-gate boundaries blur. The plan should mark
   them as N/A-for-5d4 with explicit umbrella-triage delegation (or record
   cross-sub-gate debt).
4. **Archetype-3 gate matrix compliance is binary.** Without the 10 missing
   gates added (even as PENDING_SCRIPT or DEBT_ACCEPTED with rationale), the
   gate-set-selected plan-gate box cannot be ticked, and the plan cannot pass
   regardless of other quality.

VERDICT: NEEDS-REVISION — all three blockers remain: (1) Archetype-3 gate coverage: 10 required gates unmapped (F-1, F-4, F-6, F-8, F-10, F-11, F-12, F-16, F-17, F-18); (2) Doc-lint budget: 113 errors not assigned to named slices with arithmetic; (3) JSR-audit: findings not assigned to slices, F-6 absent from Fitness Gates, drift.md cites phantom plan content.
