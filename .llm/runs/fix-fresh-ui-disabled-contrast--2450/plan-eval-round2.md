# PLAN-EVAL cycle 2 for #2450: **PASS**

The plan can go to implementation. All six cycle-1 repairs are now written into the plan as decisions, and I found no new problem that would force rework.

I re-read `plan.md`, `research.md`, `supervisor.md` and `worklog.md`. I wrote no files, launched nothing, and did not read profiles/. You were right that my first round read the files before the risk section was added. Because of that, I judged the plan as it stands now, not my earlier notes.

## Cycle-1 repairs

| # | Repair | Where it is now | Result |
|---|---|---|---|
| 1 | Add `default-token-quality.ts` to the files that may change, list the slice's files, stay under 30 | `supervisor.md` lists the adapter file; `plan.md` lists 12 package files, the run files, and at most 5 generated CLI/MCP copies | ✅ |
| 2 | Settle the open decisions | Locked: exempt rows never use an exclusion, and supplying one is an error. An exemption that applies to no preset/scheme is stale and fails. Unknown markers fail at both the adapter and the domain. Data stays at version 1, with the adapter narrowing the new field | ✅ |
| 3 | Risk register | Covers hiding active failures, losing visibility, stale generated policy, publish/surface, a disabled token later used on active text, unrelated changes to the exclusions file, old copies missing the new field, and Docker being unavailable. Each risk has a mitigation | ✅ |
| 4 | Tighter eligibility | An exempt pair must pass `foregroundRole`, carry the disabled name marker, and have minimum 4.5. An annotated `state-disabled-container` is explicitly invalid | ✅ |
| 5 | Named command control | `--negative-control=exempt-active` annotates `fg/bg` and must exit non-zero. The existing `contrast` control still runs. This matches the current controls list in `check-tokens.ts` | ✅ |
| 6 | JSR audit | Marked N/A with reasons: no change to exports or `mod.ts`, no new types that could be slow to check. The publish-size budget and dry-run still run | ✅ |

## Plan-Gate checklist
Every box is now checked:
- Research is current.
- Decisions are locked.
- The open-decision sweep is done (non-text disabled roles are deferred safely).
- The commit slices are ordered, list their files, name the gate that proves each, and stay under 30 files.
- The risk register is present.
- The gate set is chosen (domain rules plus the existing maintainer scripts).
- Deferred scope is explicit (the Figma value pass and the remaining 475 failures).
- JSR audit is N/A with a reason.

Process also checks out:
- The owner's Claude evaluator override is recorded.
- The generator is a different vendor family from me.
- Same evaluator across both rounds.
- No labels; Refs #2450 only, with no closing keyword.
- Exact-head CI must pass before READY.
- `scaffold.runtime` is explicitly UNPROVEN while Docker is unavailable.

## Things IMPL-EVAL should verify (none block this PASS)
1. **Use the repair section as the rule.** Line 3 of `plan.md` still describes eligibility only by name (`state-disabled-*` / `*-disabled`). The locked repair section adds the `foregroundRole` check and the 4.5 minimum, and it takes precedence. The code must apply all three conditions.
2. **Exclusions diff must be exactly 56 deletions.** After regenerating, `contrast-exclusions.json` should differ from the baseline only by removing the 56 disabled entries. The 475 that remain must be byte-identical.
3. **Expected counts.** The report should show 9132 checks, 58 exempt rows (passing and failing) each with reason and criterion, and 475 active failures.
4. **`exempt-active` must fail for the right reason.** It should exit non-zero because the annotation is rejected, not because some unrelated contrast failure happens to trip it.
5. **Generated copies.** Record the actual CLI/MCP file paths in `drift.md` if they differ from the ones in the plan, and keep the total under 30 files.
