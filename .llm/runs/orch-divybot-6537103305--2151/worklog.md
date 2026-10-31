# Worklog

## Design

1. Public surface: createWatcher strategy/native fail-closed diagnostics; WatchersFileWatcherAdapter lifecycle callbacks and retry; TriggerHealthMonitor snapshot served by existing child /health.
2. Domain vocabulary: watch health `watching | unavailable`; lifecycle failure/recovery events identify the trigger, time and state; file events remain create/modify/remove; strategy native/polling/hybrid.
3. Ports: existing FileWatcherPort, injected watcherFactory and clock; abortable platform delay in IO adapter; existing child health snapshot provider and telemetry logger. No speculative port.
4. Constants: named bounded retry initial/max delay; named lifecycle state/event constants; existing strategy vocabulary reused.
5. Commit slices: S1 recovery/readiness/root-loss + processor hooks; S2 health monitor/runtime/glue; S3 native strategy/error diagnostics/docs. See plan for exact touched surfaces and proving gates. Every slice updates this file and context-pack.
6. Deferred scope: downtime replay, event/dedup keys, global health storage, releases, full local scaffold runtime; owner coordinator retains these responsibilities.
7. Contributor path: adapter file explains retry and lifecycle, TriggerHealthMonitor explains public watch health, docs/site/reference/watchers/index.md explains strategies. Existing package folders remain unchanged.

Lifecycle: unavailable until ready; watching -> unavailable on watch failure; bounded retries -> watching after resource acquisition; stopped/unwatched terminal via abort. Per-trigger serial delivery, parallel independent registrations. Best-effort file detection; no promise to replay outage changes. Injected now records diagnostic time. Callback errors are isolated.

## Routing and owner override

Feature matrix resolved as JSON. Owner explicitly requests: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.” This overrides normal evaluator model selection, with distinct vendor/session retained. The evaluator gets read-only tools only. PLAN max 2, IMPL max 5; preserve context across rounds. Operator-specific Refs-only, no-label, no-local-E2E, and public privacy rules override generic assignment boilerplate.

## Bootstrap

Read assignment in full, issue and comments, skills and doctrine, consulted prior memory and NetScript MCP. Baseline main current. Real native root-removal probe confirmed remove event rather than iterator throw. PLAN-EVAL pending; no implementation yet.

## PLAN-EVAL round 1 repair

Independent reviewer returned FAIL_PLAN: starter watch root is not created by scaffold, so making every unavailable watch degrade the child would break default runtime readiness. Locked decision: preserve aggregate readiness and expose per-trigger fileWatches; the processor remains available for other triggers. Add default missing-starter-root health test (HTTP 200 with unavailable watch). No implementation yet.

Dependency wiring planned: reuse existing @std/async for abortable delay and @netscript/logger for structured runtime diagnostics, declaring imports in each consumer config without changing versions or lock files.

## S1 evidence

Implemented recovery/readiness/root removal and production logging. Structured type check passes; focused suite passes 30/30, including real deletion/recreation and pause/recovery/drain. Backoff test uses fake time to prove 10/20/20 millisecond intervals and no retry after unwatch; diagnostic failures are isolated. Native idle cancellation closes the underlying resource directly.

Negative controls (structured test wrapper, behavioral failures, exit 1): (1) restoring terminal return after watch failure breaks real recovery test; (2) removing native root-loss detection breaks the same real test; (3) removing processor onError logger breaks real processor failure/recovery test. All files restored byte-for-byte after each control.

Dependency configs and four maintained locks have only required workspace declaration metadata for existing std async/logger; no dependency versions or integrity hashes changed. Frozen reference checks initially caught missing metadata, repaired with native resolver and deps:refresh:desktop-lock. Quality rerun and independent slice review pending.

S1 final structured check/lint/fmt: exit 0; focused tests: 30/30; quality:gate: PASS (durable receipt watch-2151-s1-quality-4). Export doc lint found 3 private-type-reference diagnostics confined to unchanged workers-core/root and triggers-core contract sources; baseline comparison will be recorded before final review. No diagnostics in new watch contracts. Independent slice review next.

S1 independent review round 1: FAIL_FIX for retained external abort listeners across retries. Repair: FileWatcher stores/detaches its listener both on watch completion and stop, including never-started and pre-aborted cases. Added deterministic listener-release tests. Also ensure the default production logger is initialized before diagnostics. Baseline doc lint independently confirmed exactly 3 core and 27 plugin private-type diagnostics at the original main commit. Initial plugin comparison found one new private reference from the injectable LoggerPort; re-export that existing port alongside the option so the public type is renderable.

S1 independent repair review: PASS. Listener negative control (disable both detach paths) fails the real repeated-failure listener test with exit 1. Final structured tests: 32/32; changed-file check/lint/fmt: exit 0; quality-gate receipt watch-2151-s1-quality-5: PASS. Watchers export doc lint: clean; triggers-core remains at baseline 3 private-reference findings. Required metadata-only additions in four locks are retained; unrelated native peer-key normalization was restored. S1 reconcile: scope preserved, #eventFor/dedup untouched, #2479 still open. S1 ready to commit/push and report.

## S2 evidence

Implemented TriggerHealthMonitor as a projection over the existing ChildHealthMonitor, with immutable sorted fileWatches entries (triggerId, watching/unavailable, ISO occurredAt). Default processor hooks update it; generated glue supplies its snapshot to runChildHealthProcess. Stop/fatal failure mark every source unavailable and terminal monitors reject late recovery events. Aggregate process readiness remains independent as approved.

Structured focused tests: 22/22. Real HTTP health + real watch proves root removal/unavailable, sibling watch still watching and delivering, root recreation/watching and later handler delivery. Imported actual generated starter definition proves absent default root yields HTTP 200 with an explicit unavailable entry. Snapshot immutability and terminal lifecycle tested. Generated runtime resource tests remain green.

Behavioral negative control: disconnect default processor health update; real HTTP/root test fails (exit 1). Generated snapshot-provider removal also fails the glue regression (exit 1). Restored exact sources after each. Trigger docs and README explain the health distinction, outage delivery limits, cancellation, and custom adapter forwarding. Final changed-file wrappers/quality/doc-lint comparison and independent slice review pending.

S2 final gates: 22/22 focused tests; structured changed-file check/lint/fmt exit 0; quality-gate watch-2151-s2-quality-final PASS. Full plugin export doc lint remains exactly baseline 27 private-type references, no added watch-health diagnostic. Independent read-only S2 review PASS. S2 reconcile: no event/dedup changes; generated runtime wiring requires coordinator-enabled e2e-cli CI verdict, local full scaffold runtime remains intentionally unrun. #2479 still open.

## CI follow-up during S3

Owner reported Utility docs browser/style failure at S2 head. Current-check classifier inspected, then failing job logs: 139/140 browser tests passed; sole failure was Chromium Page.captureScreenshot “Unable to capture screenshot” on the existing dark callouts gallery. All style-policy/accessibility assertions passed. Latest main Pages run 41156251496 passed. Re-ran the failed job in run 41157318537 without test or policy changes. New S3 head will get its own docs run. No unrelated browser/style code changes needed from this evidence.

## S3 evidence

Implemented public native/polling/hybrid strategy selection, explicit-strategy precedence, runtime rejection of unsupported strategies, typed WatcherErrorEvent callback and preserved iterator rejection. Native startup permission denial reaches the actual Deno.watchFs API, emits the error diagnostic, and never enters PollingStrategy. Root removal, native event delivery, cancellation, diagnostic sink failure, polling selection and unsupported strategies are covered. Watchers suite: 31/31 (no ignored tests on this worker). Combined source/health/resource suite: 53/53 before main integration.

Two behavioral negative controls: bypass explicit native selection (the real permission-denied test fails due fallback); disable onError event emission (the same real test fails due missing diagnostic). Both exit 1; sources restored exactly. This complements S1 and S2 negative controls.

README and watcher reference describe native-only failure behavior, precedence, typed diagnostics, cancellation, fresh-instance recovery and outage delivery limits. Regenerated CLI prose and MCP export corpus; native publish dry-run exits 0 for watchers, triggers-core, triggers plugin. JSR audits pass with inherited warnings (audit helper counts the native checking-slow-types banner as a warning; native dry-run itself has no failing slow types). Watchers doc lint is clean; baseline core/plugin private references remain 3/27 before integration.

Fetched current main 4aa734e (worker retry leaf #2481) and merged normally at 5e53d13. Its shared health runner now supports async snapshots; preserve it. S3 working changes restored without source or generated conflicts, then generators rerun to retain both leaves. Retest shared child health and final public graph after integration. #2479 remains open, so its event-key change is not yet available to merge.

Post-main integrated tests: 55/55, no ignored tests; all 19 changed source/test files have clean structured check/lint/fmt. Utility docs browser rerun at S2 head completed SUCCESS (run 41157318537 attempt 2), clearing the screenshot protocol failure with no browser or policy change. Independent S3 review is next once integrated quality/freshness checks finish.

Integrated quality, MCP export corpus, CLI prose, and publish-asset checks all PASS with durable command receipts. Public validation-summary.json contains sanitized command identities/hashes/results and all eight negative controls; raw process receipts remain in the private run evidence. Integrated full-export doc lint confirms no change to baseline counts: watchers 0, core 3, plugin 27. No private operator paths/session identifiers or assignment file are tracked. Review thread gate: PASS, zero threads/unanswered. Independent S3 source review in progress.

S3 independent source review: PASS, no implementation blockers. Reviewer confirms actual native setup failure with no polling, original failure preserved through diagnostics, strategy precedence/validation and cancellation. External e2e-cli remains unproven, explicitly not claimed. Integrated native publish dry-runs also exit 0 for all three units. S3 sign-off commit follows; final IMPL-EVAL will attest exact pushed head. Reconcile: assigned three slices all implemented, no acceptance removed; sibling #2479 remains open and event/dedup behavior is untouched.
