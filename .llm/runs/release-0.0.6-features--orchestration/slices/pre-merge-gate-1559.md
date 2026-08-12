# Pre-merge gate — PR #1559 (closes #1548)

Head **`ccfa5407e`**, 2026-08-12. Evaluated head equals merge head — confirmed before merging, so the
verdict describes what actually lands.

| # | Check | Result | Evidence |
| --- | --- | --- | --- |
| 1 | `close-gate` green | **PASS** | `close-gate` → `pass`. No `acceptance-evidence` block is present and none is needed — #1548 states expectations as prose with no checkboxes. Deliberately **not** an empty block: that is what broke #1556's gate (now filed as #1561). |
| 2 | Zero unticked boxes on issues the PR closes | **PASS** | #1548 has **0** unticked boxes. |
| 3 | No new `deno-lint-ignore` / `as unknown as` / `@ts-ignore`, excluding `.llm/runs/**` | **PASS** | Diff scanned → no matches. |
| 4 | Named expensive gates `SUCCESS` | **PASS** | `scaffold-runtime (aspire + docker + postgres)` · `scaffold-runtime-sqlite` · `scaffold-static` · `code-quality` · `quality` · `check-test` · `surface-diff` · `deps-report` · `close-gate` — all `pass`, **pending = 0**. Caught mid-gate: an earlier "0 failing" reading was true while `scaffold-runtime (postgres)` was still **pending**; pending is not pass, so the merge waited for it. |
| 5 | The single decisive claim, re-verified | **PASS** | Claim: *the browser resolver's reads are now statically substitutable*. I regressed the reader to a **computed index** — behaviourally identical, every precedence test still green — and the shape guard fired (`36 passed, 2 failed`); restored → `38 passed, 0 failed`, tree clean. The IMPL-EVAL independently re-ran every gate at this head rather than trusting the slice report. |
| 6 | Changed-file audit | **N/A, audited** | Three files, all `packages/plugin-streams-core`. `mod.ts` untouched → no published-surface growth. No `packages/fresh` call-site change; no `deno.lock` churn. |
| 7 | PR body checklist matches what shipped | **PASS** | All 5 DoD boxes ticked and true, including the one that commits to stating the proof's limits. |

`agentic:review-threads` → `PASS threads=0 unanswered=0`.

## IMPL-EVAL

`OPENHANDS_VERDICT: PASS` — automatic dispatcher, run **`31593936968`**, the **sole authoritative
evaluator** for head `ccfa5407`. Root confirmed exactly-once is intact: the extra phase/generic
workflow entries were no-op/skip events, and the pending run root cancelled (`31593958280`) was
skip-only with no model spend. No evaluator was retriggered from this lane.

## What this fix does and does not prove

`arch:check` (`deno.json:156`) does **not** cover `packages/plugin-streams-core` (verified again by
the evaluator), so the package-quality verdict rests on the **explicit target scan**
(`ok=true, findings=[], allowCount=0`), not the repo gate. That is #1542.

**No test here proves Vite's `define` substitution fires in a real build.** The source-shape guard is
an explicit surrogate, accepted as such by PLAN-EVAL and restated in the PR body. End-to-end
confirmation belongs to a real Fresh/Vite build.

**Carried forward, unfixed:** `packages/sdk/src/discovery/browser-env.ts:65` has the **same**
substitutability defect. The SDK was a *structural* precedent only, never a fix precedent. It should
be filed once this shape is proven in a real build rather than fixed blind.

## Verdict

**Cleared to merge.**
