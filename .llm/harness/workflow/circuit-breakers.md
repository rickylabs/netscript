# Circuit Breakers

Circuit breakers prevent false progress. They apply to planner, generator, and evaluator sessions.

## Stuck Rule

Escalate when either condition is true:

- two implementation attempts fail for the same root cause,
- about ten minutes pass without new evidence or a narrower plan.

Before escalating, write the blocker and attempted evidence to `worklog.md`.

## Scope Explosion

Pause and ask the user before continuing when:

- the task requires a package or API redesign not named in the plan,
- a docs request turns into implementation work,
- a small package change touches several archetypes,
- resolving the issue requires new fitness-function scripts in Phase A,
- the current doctrine and implementation reality materially disagree.

Record the reason in `drift.md` with severity `significant` or `architectural`.

## Context Waste

Stop rereading broad files when the needed facts are already known. Summarize the facts into
`context-pack.md` or `worklog.md`, then use focused reads.

## Evaluation Loop Limit

The evaluator may return at most two `FAIL_FIX` results for the same run before the next session
escalates. After the second failure, the issue is likely a bad plan, hidden scope, or missing
doctrine decision.

## Debt Pressure Release

If a violation is real but out of scope, do not hide it and do not expand the run silently. Create
or update a debt entry using `templates/debt-entry.md` and let the evaluator decide whether the
entry is sufficient.
