# Verdict Definitions

Evaluator verdicts are stable values. Use exactly one.

## PASS

Use `PASS` when all are true:

- approved scope is complete,
- required static gates pass or are not applicable,
- required fitness gates pass, are not applicable, or have valid debt entries,
- required runtime and consumer gates have evidence,
- no unrecorded doctrine violation was introduced or deepened,
- docs and run artifacts are updated enough for resume.

## FAIL_FIX

Use `FAIL_FIX` when the plan remains valid but the implementation or docs need
more work. Examples:

- a required gate fails,
- evidence is missing,
- a path/link is wrong,
- a consumer import was not updated,
- a false-done state from the profile is present.

## FAIL_RESCOPE

Use `FAIL_RESCOPE` when the approved plan is materially wrong or too small.
Examples:

- the task requires a package/API redesign not named in the plan,
- the selected archetype is wrong,
- a docs run uncovers code reality that needs a separate implementation plan,
- external/runtime validation cannot be performed without adding new scope.

## FAIL_DEBT

Use `FAIL_DEBT` when code/docs may otherwise satisfy the plan, but architecture
debt handling is invalid. Examples:

- a doctrine violation is introduced without an `arch-debt.md` entry,
- an entry lacks owner, target, reason, linked plan, or status,
- new work deepens an existing debt entry without updating it,
- a run closes a debt entry without evidence that the relevant gate now passes.

`FAIL_DEBT` means the required fix is debt bookkeeping or debt rationale, not
necessarily implementation.

## Choosing Between Verdicts

| Condition | Verdict |
|-----------|---------|
| Code/docs incomplete, plan valid | `FAIL_FIX` |
| Plan/archetype/scope invalid | `FAIL_RESCOPE` |
| Only debt registry is blocking | `FAIL_DEBT` |
| All applicable gates and debt rules satisfied | `PASS` |
