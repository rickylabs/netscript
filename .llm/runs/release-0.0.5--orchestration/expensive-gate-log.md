# Expensive-gate serialisation log — `scaffold.runtime`

Three concurrent `scaffold.runtime` runs in 0.0.4 produced two failures that were contention, not
defects. This wave has three lanes and **one** holder at a time. Serialisation is a recorded
orchestrator decision, not tooling: the ledger below is the state.

**Owner decision, 2026-08-09:** do not build a lock/lease tool for this. A reusable gate token is
deferred to a post-stable issue; it is not on the 0.0.5 critical path.

## Rules

1. A lane that is otherwise gate-complete writes `EXPENSIVE-GATE-REQUEST` in its slice worklog,
   pushes, and tells the orchestrator. A request is not a grant.
2. **The orchestrator alone grants**, by appending a `granted` row here and steering exactly one
   lane. There is never more than one lane without a matching `released` row.
3. A lane runs the one-pass command only after its grant row exists, and reports the **raw exit
   code**. A `scaffold.runtime` result produced without a grant row that precedes it is **not
   admissible evidence** — pass or fail — because it cannot be distinguished from a contended run.
   That is the honest failure state; the absence of a grant row is what makes it visible.
4. The orchestrator appends the `released` row with the outcome before granting the next lane. A
   failed run releases the gate exactly like a passing one; the outcome is recorded, not implied.
5. If a holder's thread dies, the orchestrator records `released (holder lost)` with the evidence it
   checked, then re-grants. Recovery is an entry here, never a silent re-grant.

## Ledger

| # | Lane | PR    | Event                                         | Time (UTC)        | Outcome                                                                                                                                                                                                                                                                                                                                                    |
| - | ---- | ----- | --------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | W2-C | #1393 | requested                                     | 2026-08-08T21:5x  | otherwise gate-complete; all non-runtime gates reported exit 0                                                                                                                                                                                                                                                                                             |
| 2 | W2-C | #1393 | **granted**                                   | 2026-08-08T22:0x  | sole holder; W2-A and W2-B were paused at PLAN-EVAL and could not contend                                                                                                                                                                                                                                                                                  |
| 3 | W2-C | #1393 | ran                                           | 2026-08-08T22:12Z | raw exit 0, `passed=76 failed=0`, `cleanup.aspire-stop` included; pre/post leak-check clean; one foreign container (`redis-jfgcbtaf`, owned by `/home/codex/repos/w6-review-desk`) left untouched                                                                                                                                                          |
| 4 | W2-C | #1393 | **not admissible for this slice's own gates** | 2026-08-08T22:12Z | the lane self-reported that the suite allowlist had omitted `database.migration-artifacts`, both `runtime.capture-db-allocation-*`, and `behavior.live-db-endpoint`. The run proves the scaffold still works and proves nothing about #1327's new evidence. The lane repaired the selector at `93183accb` and correctly did **not** retry without a grant. |
| 5 | W2-C | #1393 | **granted (second pass)**                     | 2026-08-09        | at the repaired head, after the test-restoration commit. W2-A and W2-B are implementing and not contending. Must confirm all four previously-omitted gates appear in the executed set, with each one's result.                                                                                                                                             |
| 6 | W2-C | #1393 | released                                      | —                 | pending                                                                                                                                                                                                                                                                                                                                                    |

W2-A (#1394) and W2-B (#1395) are implementing behind the holder and are briefed not to start the
command until their own grant row exists.
