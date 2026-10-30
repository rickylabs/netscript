# Worklog

## Owner routing override (verbatim)

> Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only. Feature-tier loop: at most 2 PLAN-EVAL rounds and 5 IMPL-EVAL rounds. The final IMPL-EVAL must review the exact pushed head and end with one line: VERDICT: MERGE <full sha> or VERDICT: CHANGES <full sha>.

This explicit owner-selected route supersedes the default evaluator matrix for this runtime-critical acceptance proof. Generator/evaluator session and vendor independence remain mandatory.

## Bootstrap

- Read the complete assignment and live issue comments. No orchid-triage comment or duplicate implementation PR found; #2477 is the prerequisite, already merged.
- Fetched main: exactly the initial worktree baseline.
- Read #2165 memories before implementation research. RTK is absent; focused raw commands and structured wrappers will be used.
- In-repo MCP find_guidance then search_docs consulted before implementation.
- Issue acceptance is a plain sentence, not a checkbox section; preserve all requested proof requirements without editing issue acceptance.

## Design

1. **Public surface:** existing defineFileWatch → WatchersFileWatcherAdapter → TriggerProcessor → KvTriggerIdempotencyStore pipeline; only file-watch identity and default completed TTL change. No new exports or schema.
2. **Domain vocabulary:** file-change identity = triggerId/path/kind/mtime/size; unknown-change identity = UUID; active claim excludes simultaneous duplicate processing; completed TTL controls later suppression. Existing pending/completed/DLQ and stop/drain lifecycle remain.
3. **Ports:** existing FileWatcherPort, WatcherInstance/watcherFactory (controlled external events), TriggerIdempotencyPort (real disk KV), TriggerDlqPort, injected now clock. Existing cancellation and adapter error-hook supervision remain. Two processors share a claim domain in concurrency tests.
4. **Constants:** named file-watch key namespace and named zero completed-TTL policy; reuse DEFAULT_TRIGGER_IDEMPOTENCY_TTL_MS for other kinds. JSON tuple instead of separator concatenation; Web crypto.randomUUID for unknown changes.
5. **Commit slices:** S0 research/design + run record, then S1 adapter keys + TTL + adapter/runtime regressions + docs + run evidence (smallest atomic bug correction). Gates and exact files listed in plan.md. S2 only for concrete evaluator/CI repairs.
6. **Deferred scope:** scheduled-event/key-resolution work already merged; no store rewrites, dependency updates, builder expansion, event-id redesign or local scaffold E2E. Coordinator controls merges/taxonomy.
7. **Contributor path:** read src/adapters/watchers-file-watcher-adapter.ts and its colocated tests to extend event identity; runtime/file-watch-idempotency_test.ts shows persistence and claim lifecycle. Documentation entry: docs/site/durable-workflows/triggers.md.

## S0 reconcile

Live issue addendum owns readiness flow and in-flight interpretation. Follow owner-specific Refs opening with no normal upstream closing keyword; generic dispatcher requires the exact final tracking line. No labels/milestones changed. Independent PLAN-EVAL selected explicitly by owner before implementation.
