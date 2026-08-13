# Plan — release 0.0.7 fixes topic

The milestone plan was approved by separate PLAN-EVAL at immutable plan head `331f7c664`. This
topic plan does not reinterpret or expand it.

## Wave 0

1. Create `fix/legacy-port-pin-sweep` from live `origin/main`, with no upstream, and launch one
   attached Codex implementation thread through the agentic suite.
2. Create `fix/scaffold-generated-output-correctness` from the same live `origin/main`, with no
   upstream, and launch one attached Codex implementation thread through the agentic suite.
3. Require each leaf to inspect live issue bodies, reproduce each defect red-first or record the
   approved fallback, bootstrap its own tracked harness artifacts, and make its PLAN-EVAL decision
   before implementation.
4. Keep both leaves within the topic WIP bound. Permit at most one evaluator and no expensive gate
   unless the coordinator grants the singleton global lease.
5. After each implementation slice reports green structured evidence, perform substantive Tier-A
   review; require the supervisor sign-off commit, explicit-refspec push, and per-slice PR comment.
6. Dispatch a separate opposite-family IMPL-EVAL only after the leaf is complete and the current
   head is stable. Hand a PASS leaf to the coordinator without merging it.

## Deferred scope

All other fixes leaves remain undispatched until their DAG wave is released by the coordinator.
No publication, milestone mutation, central state mutation, or user-worktree cleanup belongs here.
