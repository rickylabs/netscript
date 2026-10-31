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
4. **Constants:** named file-watch key namespace and named zero completed-TTL policy; reuse DEFAULT_TRIGGER_IDEMPOTENCY_TTL_MS for other kinds. SHA-256 of a JSON tuple instead of separator concatenation or unbounded path keys; Web crypto.randomUUID for unknown changes.
5. **Commit slices:** S0 research/design + run record, then S1 adapter keys + TTL + adapter/runtime regressions + docs + run evidence (smallest atomic bug correction). Gates and exact files listed in plan.md. S2 only for concrete evaluator/CI repairs.
6. **Deferred scope:** scheduled-event/key-resolution work already merged; no store rewrites, dependency updates, builder expansion, event-id redesign or local scaffold E2E. Coordinator controls merges/taxonomy.
7. **Contributor path:** read src/adapters/watchers-file-watcher-adapter.ts and its colocated tests to extend event identity; tests/file-watch-idempotency_test.ts shows persistence and claim lifecycle. Documentation entry: docs/site/durable-workflows/triggers.md.

## S0 reconcile

Live issue addendum owns readiness flow and in-flight interpretation. Follow owner-specific Refs opening with no normal upstream closing keyword; generic dispatcher requires the exact final tracking line. No labels/milestones changed. Independent PLAN-EVAL selected explicitly by owner before implementation.

## Baseline gates (before production edits)

- `deno task quality:gate`: exit 1; root coverage passes, quality scan reports the existing unsafe cast in docs/site/_plugins/markdown-render-fixture.ts:48. No changed production code exists yet.
- `deno task arch:check`: exit 0; repository dependency and architecture checks pass with existing warnings.
- Draft PR #2479 opened from S0 commit cbe30332b62b65bc4bcbe083584c75ef6b857e1d before implementation.
- Git author identity was unset despite dispatcher expectations; commits use the authenticated owner's established public noreply identity without attribution footers.

## PLAN-EVAL round 1 repair

Independent Claude returned FAIL_PLAN with two blockers: raw path-bearing keys can exceed Deno KV limits; blanket negative-control expectations did not distinguish regressions from preserved behavior. Plan now hashes the five-field JSON tuple, includes long-path disk-KV coverage, and maps each acceptance/control to both-production and each-production-file reverts. In particular, concurrent distinct missing-metadata events isolate the adapter requirement; completed same-metadata replay/restart isolates the TTL requirement. No implementation began before this plan repair.

## PLAN-EVAL round 2

Independent owner-selected native Claude returned PASS before production edits. Both design blockers resolved; original adapter/TTL behaviors cross-checked by evaluator. Proceeding to S1.

## S1 implementation and gates

Adapter now emits fixed-size SHA-256 tuple keys or per-event UUIDs, preserving the existing counter only as event.id. The processor defaults only file-watch completed TTL to zero, leaving explicit policy and #2165 key precedence untouched. Docs explain trigger/worker/upstream watcher policies.

17 new tests cover all requested proofs, including actual filesystem writes, disk-KV reopen, same-snapshot active claims and post-completion eligibility, concurrent distinct unknown changes, all tuple dimensions and partial-metadata shapes. Tests live in the existing tests/ cross-cutting directory to avoid deepening runtime folder cardinality. No new architecture debt accepted.

Final broad tests: 88 passed, 0 failed, 3 Redis-only ignored. Check/lint/fmt: 88 files, clean. Scoped quality, architecture/dependencies, JSR audit and package publish dry-run pass. Broad quality:gate remains red on the pre-existing docs fixture cast; full-export doc lint remains red on the same three baseline private-type-ref diagnostics. See gate-evidence.md for exact commands, negative-control sensitivity, digests and limitations.

Negative controls: both production files reverted → 15 failures; adapter only → 8 failures; TTL only → 2 failures. All are intended semantic failures with no type/setup failures. Restored fixed bytes before final broad tests. Independent slice review/IMPL-EVAL pending before sign-off commit.

## S1 reconcile

Scope remains one file-watch fix; #2165 functions/store unchanged. No new labels/milestones or issue acceptance edits. Draft PR #2479 is the review surface; no lock churn. Ready transition waits for independent implementation review. No local scaffold runtime run.

Re-fetched main during S1 review: still 7907293f3dad3aeb557923809ddcd3435adae151. PR discussion contains no new owner scope changes. Observed evaluator stream model for both PLAN-EVAL rounds and S1 review is claude-opus-5-5; high effort requested through the native CLI flag. Raw session identity remains outside Git.

## Independent S1 implementation review — PASS

Native Claude (observed model claude-opus-5-5, requested high effort) substantively reviewed source, tests, docs, doctrine delta and privacy before sign-off. It independently reran the two new suites and existing processor tests: 24 passed, 0 failed. No blockers. Full report: evaluate.md. Known baseline gate failures remain explicitly ungreen. Sign-off commit/push now follows; final exact-head review will be posted on PR #2479 after ready transition without changing that head.
