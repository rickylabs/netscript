# PLAN-EVAL — 5d4-streaming (re-eval #3, independent evaluator)

- Plan evaluator session: run-27464169296-1 / 2026-06-13
- Run: `feat-package-quality-wave5-apps--5d4-streaming` (PR #37)
- Surface / archetype: `@netscript/fresh` / Arch 3 (Runtime / Behavior) + SCOPE-frontend
- Revision cycle: 2 → 3 (this evaluator is independent of the generator)
- Prior `plan-eval.md` deleted on branch — recreated here fresh.

## Clock-port blocker (L-5d4-7)

RESOLVED — supervisor locked the decision to a local in-package fake-timer helper (promote to `./testing` only on reuse). Accepted without further comment.

## Blocker 1 — Archetype-3 gate coverage (18 required fitness gates)

### Required gates (from `gates/archetype-gate-matrix.md`, Arch-3 column marked **required**)

| ID  | Gate name                            | Required by Arch-3 | Mapped in plan.md Fitness Gates table |
| --- | ------------------------------------ | ------------------ | ------------------------------------- |
| F-1 | File-size lint                       | yes                | ❌ no                                  |
| F-2 | Helper-reinvention scan              | yes                | ✅ yes                                 |
| F-3 | Layering check                       | yes                | ✅ yes                                 |
| F-4 | Inheritance audit                    | yes                | ❌ no                                  |
| F-5 | Public surface audit                 | yes                | ✅ yes                                 |
| F-6 | JSR publishability                   | yes                | ❌ no                                  |
| F-7 | Doc-score gate                       | yes                | ✅ yes                                 |
| F-8 | Workspace lib check                  | yes                | ❌ no                                  |
| F-9 | Permission decl check                | yes                | ✅ yes                                 |
| F-10 | Test-shape audit                    | yes                | ❌ no                                  |
| F-11 | Forbidden-folder lint               | yes                | ❌ no                                  |
| F-12 | Naming-convention lint              | yes                | ❌ no                                  |
| F-13 | Saga/runtime invariants             | yes                | ✅ yes                                 |
| F-14 | Console-log lint                    | yes                | ✅ yes                                 |
| F-15 | Re-export-upstream lint             | yes                | ✅ yes                                 |
| F-16 | Folder-cardinality lint             | yes                | ❌ no                                  |
| F-17 | Abstract-derived co-location        | yes                | ❌ no                                  |
| F-18 | Sub-barrel lint                     | yes                | ❌ no                                  |

### Other required gate families (Arch-3)

- **Static gates** → partially addressed (Validation Plan rows 1–3).
- **Runtime/Aspire validation** → not in plan.md Validation Plan, only implicit via `e2e:cli`.
- **Consumer import validation** → Slice 7 covers it (not in Fitness Gates table).

### Count

- **Mapped in Fitness Gates table: 8 / 18 required**.
- **Unmapped with no N/A rationale: 10** (F-1, F-4, F-6, F-8, F-10, F-11, F-12, F-16, F-17, F-18).
- The plan’s "Fitness Gates" table is therefore the 8 F-series gates listed there; it does **not** satisfy the full Archetype-3 required set.

### Verdict — BLOCKER 1

**FAIL.** The plan lists only 8 gates and omits 10 required gates (including F-6 JSR publishability and F-1 file-size) without N/A rationale or drift entry. The prior evaluator’s gate-coverage concern is **not resolved**.

---

## Blocker 2 — Doc-lint budget (113 errors)

### Measured baseline

- Committed artifact `doc-lint-raw.txt` confirms: `error: Found 113 documentation lint errors.`
- `research.md` §Doc-lint baseline re-verifies this total: **113 combined**, split 63 / 50.

### How plan.md handles it

- `§Hidden Scope` mentions: "budget one slice for doc lint sweep" (line 67) — generic.
- `§Fitness Gates` lists F-5/F-7 with a "Doc-score check on `packages/fresh` changed files = 100" — a target, not a reconciliation.
- `§Commit Slices` lists only 8 slices; only Slice 1 (F-5/F-7) mentions "doc lint clean" on 2 files (`DeferPage.tsx`, `stream-error-boundary.tsx`).
- `§Validation Plan` row 4 scopes F-7 as `deno task publish:dry-run` for "doc score 100".
- **No arithmetic** assigning 113 errors to named slices.
- **No error-bucket reconciliation** against the committed `doc-lint-raw.txt` / `doc-lint-combined-refresh.txt` artifacts.

### Phantom references in drift.md

- `drift.md` §D-5d4-10 ("32 upstream errors in streams/, Slice 6 bucket") cites plan.md `§Doc-Lint Budget Reconciliation (Slice 6 bucket)` and `§Commit Slices (Slice 6)`.
- plan.md has only 8 slices and has **no such section**; Slice 6 in plan.md is "Permission / README update", not an upstream-type wrap.
- This means the drift entry's cross-reference is stale — the budget reconciliation it assumes was never written into plan.md.

### Verdict — BLOCKER 2

**FAIL.** doc-lint is handled only by a generic "doc sweep" mention and two-file Slice 1; there is no arithmetic reconciling the 113 reported errors against named slices, and no bucket assignment across the commit list. The `drift.md` cross-references a plan section (`§Doc-Lint Budget Reconciliation`) that does not exist in `plan.md`, which confirms the reconciliation was planned but not committed.

---

## Blocker 3 — jsr-audit publishability scan

### Dry-run execution

- **YES — the scan was actually executed.** Four committed artifacts prove real runs:
  - `jsr-dry-run-raw.txt` (48.7 KB)
  - `jsr-publish-dry-run-5d4.txt` (38.9 KB) — final line: `error: Found 62 problems`
  - `jsr-publish-dry-run-5d4-local.txt` (38.9 KB)
  - `jsr-dry-run-package-fresh.txt` (38.9 KB)
- Breakdown of the 62 problems from the artifacts:
  - 54 `excluded-module` (most from root `deno.json` excluding `packages/fresh/`)
  - 8 `missing-explicit-return-type` slow-type issues (`form/enhancement.tsx`, `form/form-region.tsx`, `form/form.tsx`, `query/query-island.tsx`)
  - 2 `slow type` references

### How plan.md handles it

- `§Fitness Gates` table **does NOT include F-6** (JSR publishability), which the gate matrix marks **required** for Archetype 3.
- `§Validation Plan` only mentions `deno task publish:dry-run` as an F-7 evidence row; no findings inventory.
- The only JSR-related decision in `§Locked Decisions` is `L-5d4-2` ("Replace private Preact type refs … Satisfies F-5, F-7, and JSR publishability") — only addresses 2 files.
- **No §JSR-audit section exists in plan.md.**
- **No finding-to-slice assignment** for the 62 problems.

### Phantom references in drift.md

- `drift.md` §D-5d4-8 (58 excluded-module, Slice 1, "L-5d4-8") and §D-5d4-9 (4 slow-types, Slice 9, "L-5d4-9"):
  - `L-5d4-8` and `L-5d4-9` are **not in plan.md** (which stops at L-5d4-7).
  - Slice 9 does **not exist** in plan.md (which has 8 slices).
  - Cited sections `§JSR-Audit / Over-Cap Budget Reconciliation` do not exist.
- The generator's drift entries assume content that never made it into the binding plan.md.

### Verdict — BLOCKER 3

**FAIL** (partial). The dry-run was genuinely executed with committed artifacts (first half satisfied). However, findings are **not assigned to slices**, `F-6` is **missing from the Fitness Gates table**, the `plan.md` lacks a JSR-audit section entirely, and `drift.md` cross-references locked decisions and slices (L-5d4-8, L-5d4-9, Slice 9) that **do not exist in the binding plan.md**. The jsr-audit checklist item is therefore incomplete.

---

## Checklist results (per `gates/plan-gate.md`)

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` present; verified 113 baseline; D-5d4-1 acknowledges prior-run false claims |
| Decisions locked                        | PARTIAL | 7 decisions (L-5d4-1…7) locked, but drift.md references 2 phantom decisions (L-5d4-8, L-5d4-9) that were never written into the binding plan |
| Open-decision sweep                     | PASS   | 3 decisions listed with proper deferral status |
| Commit slices (< 30, gate + files each) | FAIL   | 8 slices, but drift.md references a Slice 9 that does not exist; and Slice 1 cannot absorb the 113 doc-lint errors + JSR excluded-module errors it is claimed to handle |
| Risk register                           | PASS   | 4 risks with mitigations |
| Gate set selected                       | FAIL   | 8/18 required Arch-3 fitness gates mapped; F-1, F-4, F-6, F-8, F-10, F-11, F-12, F-16, F-17, F-18 omitted with no N/A rationale |
| Deferred scope explicit                 | PASS   | `§Non-Scope`, `§Arch-Debt Implications` clear |
| jsr-audit surface scan (pkg/plugin)     | FAIL   | dry-run executed with artifacts, but findings not assigned to slices; F-6 absent from Fitness Gates; drift.md cites sections/locks that do not exist in plan.md |

## Open-decision sweep (evaluator-run)

- The drift entries D-5d4-8, D-5d4-9, D-5d4-10 are already marked as resolved to specific slices and locked decisions, but the slices/locked decisions are not present in plan.md. They are **orphan drift entries**.
- The plan does not explicitly state whether the 54 `excluded-module` errors (most outside 5d4's streaming scope) are N/A / accepted debt for 5d4, or are in-scope. This is a material open decision not captured in the sweep.

## Verdict

**FAIL_PLAN**

### Required fixes (still unresolved after this third cycle)

1. **Blocker 1 — gate coverage.** Add to plan.md `§Fitness Gates` every remaining required Arch-3 gate (F-1, F-4, F-6, F-8, F-10, F-11, F-12, F-16, F-17, F-18) with PASS/PENDING_SCRIPT/DEBT_ACCEPTED status and manual evidence, or explicitly mark them N/A with rationale. Also add Static, Runtime/Aspire and Consumer gate rows.
2. **Blocker 2 — doc-lint arithmetic.** Add a plan.md section enumerating the 113 doc-lint errors, bucketed by file/category, assigned to specific slices (by name, not "one sweep slice"), and reconciled against `doc-lint-raw.txt`. Drift.md D-5d4-10's phantom cross-reference to `§Doc-Lint Budget Reconciliation` must either be implemented in plan.md or the drift entry revised.
3. **Blocker 3 — JSR-audit findings assignment.** Add F-6 to the Fitness Gates table. Add a plan.md section listing the 62 JSR dry-run findings, triaging each category (excluded-module, slow-type) as in-scope for 5d4 or N/A/debt (with rationale for out-of-scope findings belonging to other sub-gates 5d2/5d5/5d6). Assign in-scope findings to named slices. Commit the missing locked decisions `L-5d4-8` and `L-5d4-9` if they are intended (the dry-run evidence supports them), or remove the drift entries that cite them.

### Artifact-consistency defect (non-blocking but noted)

`drift.md` is internally inconsistent with the binding `plan.md` — it cites 2 phantom locked decisions (L-5d4-8, L-5d4-9), 1 phantom slice (Slice 9), and 2 phantom plan sections (`§JSR-Audit / Over-Cap Budget Reconciliation`, `§Doc-Lint Budget Reconciliation`). The generator appears to have prepared drift entries for content the plan revision never actually produced. Either the drift entries must be rewritten to match the actual plan, or the plan must be extended with the content the drift entries describe.

## Notes

- Clock-port blocker (L-5d4-7) is resolved and accepted.
- The `research.md` re-baselining of the prior run's false-claims is sound (D-5d4-1).
- This is the third cycle; if a fourth FAIL_PLAN is returned, escalate to the user per `plan-protocol.md`.
