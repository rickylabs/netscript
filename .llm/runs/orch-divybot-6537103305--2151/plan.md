# Plan & Design — READY FOR REVIEW

Archetype 3 (runtime/behavior) for watchers and triggers-core, with plugin integration and documentation. Doctrine current verdict keeps watchers and requires cancellation/stop propagation. Owner explicitly selected PLAN-EVAL; no implementation before PASS.

## Locked decisions

1. Keep filesystem events and diagnostic lifecycle events separate. Add watcher readiness callback and adapter lifecycle callback carrying trigger id, watching/unavailable state and occurrence time; preserve onError and wire production structured logging.
2. Adapter supervisor owns retry. A failed creation, iterator error, or unexpected iterable completion becomes unavailable; stop the failed watcher, wait with abortable exponential backoff bounded at a named maximum, then build a fresh watcher. Success is actual watcher readiness, not factory allocation. Error hooks and handler exceptions remain isolated; handler failures do not restart the watch. stop/unwatch cancel retry, close resources and drain tasks; stale registrations cannot update replacements.
3. Native root-removal events fail before event filtering. Hybrid propagates unavailable-root errors instead of silently switching to polling. Root recreation allows adapter retry to reopen the actual native watcher.
4. TriggerHealthMonitor extends the existing ChildHealthMonitor and overrides snapshot with per-trigger fileWatches, preserving aggregate child readiness. Generated runtime glue supplies its snapshot to the existing child health transport. Base monitor callers remain compatible. Per-watch unavailability does not change aggregate child readiness: the processor continues servicing scheduled and other triggers, while fileWatches identifies each unavailable source. The default starter watches a root not created by scaffold, so missing optional/user-provided roots must be visible without preventing the child from serving. A default-starter test must prove HTTP 200 and explicit unavailable. No global state or new health endpoint.
5. Public strategy accepts the existing built-in native/polling/hybrid vocabulary; native bypasses network heuristics and hybrid fallback. Explicit strategy overrides legacy forcePolling (documented); reject unsupported runtime strategy values. Public watcher onError callback emits failures and iterator rejection remains fail-closed. Defaults remain automatic.
6. Preserve sibling #eventFor and dedup behavior. Merge main after #2479 lands, without force-pushing.

## Slices and gates

1. Recovery + diagnostics + onError wiring: watchers readiness/native root-loss handling and adapter retry/contracts/tests; plugin processor logging. Real root deletion/recreation reaches the handler after recovery; deterministic failure/backoff/cancel/handler isolation tests. Scoped wrappers, quality:gate, independent slice review; commit/push/comment.
2. Per-trigger health: TriggerHealthMonitor, runtime lifecycle wiring, generated glue and tests. Real watcher and processor show unavailable then watching through /health fileWatches, including two-trigger isolation, shutdown, and default starter with a missing root reporting HTTP 200 plus unavailable. Structured gates, resource-template tests, independent review; commit/push/comment.
3. Native-only public strategy + docs: watchers options/factory/onError tests and reference/README. Real native setup failure emits error and rejects, no polling; native runtime root loss and successful native event delivery covered; invalid strategy and precedence tests. Scoped gates, doc lint, JSR audits/dry-run, negative controls, independent implementation review; commit/push/comment.

All slices include worklog/context reconciliation. Final independent IMPL-EVAL reviews exact pushed head, readiness triggers CI, final same-reviewer pass attests that head. Coordinator alone merges.

## Gate selection

Structured check/test/lint/format wrappers over changed source/tests with unstable-kv for checking; focused watcher/core/plugin runtime and generated glue tests; quality:gate (quality scan + architecture fitness); full-export doc lint, applicable JSR audits and per-unit publish dry-run. Negative controls temporarily revert relevant fixes while retaining tests, then restore byte-for-byte. No local scaffold.runtime per owner. Runtime glue requires e2e-cli CI verdict, coordinator arms label. Report unproven CI honestly.

## Risks and mitigations

- Root removal need not throw: detect root-level native remove before allowed-kind filters, distinguish root loss in hybrid.
- Readiness races: callback only after native open/polling initialization; initial state unavailable until readiness.
- Retry storms/leaks: bounded abortable backoff, single registration/task, per-attempt cleanup, cancellation tests.
- Hook failures and stale callbacks: isolate hooks, check registration identity/signal, never turn handler exceptions into watch failures.
- Compatibility: additive optional lifecycle/readiness/error callbacks; preserve forcePolling default behavior; health snapshots extend existing payload.
- Parallel key changes: owned paths only, merge #2479 and retest existing identity semantics.

## Open decisions

None blocking. Exact backoff defaults and test timing budgets are implementation constants (safe to choose within bounded policy). Documentation asset generation only if checked-in docs gate requires it.

## Deferred scope and debt

No durable replay of changes during downtime, cross-process health store, automatic return from hybrid polling to native, changes to event/dedup keys, release/version bump, or local full scaffold runtime. These are outside the requested behavior. Existing AP-13 warnings remain existing debt; no accepted new architecture debt planned.
