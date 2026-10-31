# Drift (append only)

2026-10-31: Owner explicitly requested next tracker leaf after #2476 merged, superseding the previous leaf's STOP-at-READY end-of-run boundary for the new work. New #2400 run keeps its own coordinator brief and boundary. No ownership/control-plane changes in the coordinator's run.

2026-10-31 PLAN1: preserve cumulative published restartCount; add resettable restartBudgetUsed instead. Named concrete test files, onStarted HTTP surface assertions and actual Redis queue listener recovery/negative invocation. CLI cause-reader propagation and per-restart Redis abort callbacks explicitly deferred.

2026-10-31 resume: adopted existing PR2482 rather than the generic dispatcher branch.
The owner-specific resume brief governs branch, reference-only PR body, shared E2E,
and STOP-at-READY; generic create-another-PR/auto-close/fan-out boilerplate conflicts
with that scoped instruction and is not applied. Final visible report uses the
assignment's file-publication handoff. Existing PR is already ready, not draft.

2026-10-31 rebaseline proof found main #2395 replaced Redis BRPOPLPUSH with Lua
receipt claims. Initial resumed tests:108PASS,1FAIL,6ignored; the legacy ACL denial
never reached the new adapter, so its timeout is not accepted as negative proof.
Update the existing Redis test to deny EVAL/EVALSHA for its isolated user, enqueue
pending work and require recovery. Settle the delivered message before denial to
isolate claim refusal from settlement. The fake-clock negative control now races
completion so old behavior yields an assertion instead of an unresolved promise.
Review4429709762 identified typed QueueConnectionError misclassification; classify
the existing QueueError CONNECTION_FAILED contract, including nested causes.
No new API/dependency or expansion into queue-adapter production code.

2026-10-31 freshness gates reproduced two stale generated carriers from the
original PR: the CLI/MCP prose bundle for the changed tuning guide and the MCP
export corpus for the additive Worker public types. Refresh only through their
native generation tasks. This required generated surface is added to supervisor
write scope; no dependency/lock refresh is authorized or needed.
