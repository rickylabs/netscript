# Brief — #1112 complete wrapper-reference sweep at `dd91bf1b4`

Canonical author, thread `01a047f1-56bf-7060-b9c4-dbc5dc4ad2a8`, head
`dd91bf1b41286e24b563ac1907db048345c2abb5`.

Your three corrections are verified correct and artifacts-only: product paths byte-identical to
`30cc8d084`, gate-5 table row updated, `worklog.md:68` cleaned, and the new `drift.md` entry properly
**supersedes** the historical line 165 instead of rewriting it. That is exactly right.

**My previous brief was the problem: I named three sites when the defect has eight.** I swept the
gate table and the worklog but not the plan's prose, so you fixed precisely what I asked and the
contradiction survived elsewhere. That is my error, not yours. Here is the complete sweep so this
closes in one pass.

## Remaining live-prescriptive references to the dropped wrapper

Rule being applied: the plan's **gate protocol, gate list, slice proving-gates, and risk
mitigations** must describe what is actually run — that is gate-set integrity. Purely historical
narrative stays untouched.

| File:line | Current text | Required |
| --- | --- | --- |
| `plan.md:64` | "Keep the scratch-only compatibility wrapper as D17 evidence and the import-only smoke as runtime-resolution evidence." | Drop the wrapper clause; gate 5's D17 evidence is the actual-example check. Keep the smoke clause. |
| `plan.md:175` or `:176` | slice proving-gates list naming the `compatibility wrapper` | Remove that item from the slice's proving gates. |
| `plan.md:226` + the following ```ts block | "The exact `.llm/tmp/prisma-example-compatibility.ts` remains a focused D17 probe rather than the sole evidence…" | Remove the sentence and its code block, or restate both as explicitly not part of gate 5. |
| `plan.md:257` | "Then run the structured check on the scratch D17 compatibility wrapper." | **Delete this imperative.** It is the sharpest contradiction: the protocol still orders a step nobody runs. |
| `plan.md:293` | risk row: "gate 5 checks the actual example with the real generated client, **retains the D17 wrapper**, and executes the guarded import smoke" | Drop the "retains the D17 wrapper" clause. |
| `research.md:318` | "…gate 5 checks the actual example with generated output present, **retains the D17 wrapper**, and runs the guarded import smoke." | Same clause removal. |

Leave alone as correct history: `drift.md:137`, `:165`, `:205`; `worklog.md:109`, `:161`, `:211`;
`research.md:238`. These record what was planned or measured at the time and are superseded by your
new drift entry, not contradicted by it.

No new drift entry is needed — the one you just added already covers the decision. This pass only
makes the forward-looking text match it.

## Explicitly NOT in scope

The plan still prescribes narrowing to `SqlResultSet['columnTypes']` while you shipped the inline
union. **Leave that as-is.** Your 2026-08-29 doc-lint drift entry records that divergence properly,
and it affects no gate step — unlike the wrapper, which sat inside the gate protocol itself.

## Boundaries

- Artifacts only. Do not touch the seven product paths; the code is verified and must not move.
- No `deno.lock` change, no new path, no gate re-runs — nothing here affects them.
- No merge, readiness flip, label, or PR state change. No self-certification.

## Finish

Before committing, grep your own work: `grep -n "compatibility wrapper\|prisma-example-compatibility\|D17 wrapper\|D17 probe" plan.md research.md context-pack.md` and read every hit, confirming each
survivor is historical narrative rather than an instruction. Then commit, **explicitly push** with a
full refspec, and report the head SHA. The supervisor confirms artifacts-only and dispatches
IMPL-EVAL.
