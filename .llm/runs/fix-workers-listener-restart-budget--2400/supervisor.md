# A3 / #2400 leaf

Implementation: Codex, feature tier, owner-authorized continuation from merged H01 PR #2476. Baseline main a410a815ce1401d533b18f2a85eb75e266de94a5. Branch fix/workers-listener-restart-budget, direct PR to main. Claim: issue #2400 comment 6536634074.

Scope: plugins/workers/worker/listener-supervisor.ts and tests, worker-options.ts, worker.ts, queue-consumer.ts, directly related listener health/runtime tests, worker runtime tuning docs, and this run directory. No changes to #2144 job-dispatcher.ts or job-execution.ts. No dependencies or scaffold output intended.

Process: coordinator #2474 brief #2400, PLAN-EVAL before implementation, independent Opus 5.5 high-effort read-only evaluator (same session across rounds), max2 plan/max5 implementation rounds. Final verdict must name exact pushed commit. No local scaffold.runtime; coordinator owns shared E2E labels and merge. No labels or milestones changed. No private runtime identities/paths in public evidence. Native repo launcher is the evaluator execution interface; routing query and owner override will be recorded before dispatch.
