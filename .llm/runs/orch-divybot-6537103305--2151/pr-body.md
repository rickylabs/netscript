Refs https://github.com/rickylabs/netscript/issues/2151

## Summary

File-watch triggers now recover after their watched root is removed and recreated. The adapter reports failures and recovery, retries with abortable capped backoff, preserves pause state, and drains on shutdown. The trigger child exposes each watch as `watching` or `unavailable` through its existing health response while other triggers keep running.

`createWatcher({ strategy: 'native' })` uses native notifications only. Setup/runtime failures emit a typed `onError` diagnostic and reject the iterator with the original error, without entering polling. Explicit strategy selection overrides automatic heuristics and `forcePolling`; automatic defaults remain available.

## Scope

Archetype 3 runtime behavior in watchers, triggers-core, and trigger plugin runtime. Coordinated under #2474, group A3. Main #2481 is integrated normally; sibling event-key #2479 is still open. Existing event-key/dedup behavior is preserved.

## Slices

- [x] S1 Bounded recovery, lifecycle events, cancellation/listener cleanup, and processor error wiring — `357e444`.
- [x] S2 Per-trigger watch health through the existing child endpoint and generated snapshot provider — `9fecb32`.
- [x] S3 Native-only strategy, typed error diagnostics, documentation, and refreshed generated carriers.

## Validation

- **55 focused tests pass, zero ignored on this worker**, including real root deletion/recreation, HTTP health transitions, sibling delivery during outage, the actual generated starter with a missing root, real native permission denial with zero polling, and shared child-health runner tests.
- Structured check/lint/format wrappers pass over all 19 changed source/test files. `quality:gate` (quality scan + architecture/dependency checks) passes.
- Eight behavioral negative controls fail the intended regressions with types intact, then source is restored exactly.
- Native publish dry-runs and JSR audits pass for all three affected units. Watchers export doc lint is clean. Triggers-core/plugin retain baseline private-type-reference findings of **3/27**, independently compared with main; no new diagnostic is added.
- MCP export corpus, CLI prose, and publish-asset freshness checks pass after regeneration against integrated main. The docs site builds successfully.
- Independent read-only PLAN-EVAL and all three slice reviews pass. Exact pushed-head IMPL-EVAL follows this commit.
- Reported Utility docs browser failure was a Chromium screenshot protocol error (139 other tests passed); run **41157318537 attempt 2 passed** without changing browser tests or style policy. The final head receives fresh CI runs.

**Required external gate:** runtime glue changed, so an **e2e-cli CI verdict is required**. The coordinator owns enabling `e2e-cli-gate`; full local scaffold.runtime was excluded by the assignment and is not claimed as proven. Required final-head CI must be green before merge.

## Harness

Run: `.llm/runs/orch-divybot-6537103305--2151/`. See its worklog, independent review records, negative-control summaries, and validation-summary.json. Coordinator owns labels, milestones, and merging.

## Drift / Debt

No new architecture debt accepted. Existing watcher console-warning debt and baseline doc-lint private references remain outside this change. Four lockfiles contain only required workspace metadata for declaring the existing std async/logger dependencies; **no dependency versions or integrity hashes changed**. No force-push and no local scaffold runtime run.

## Definition of Done

- [x] Real root deletion/recreation reports failure and recovery, then delivers later file changes.
- [x] Existing health response identifies every watched trigger as watching or unavailable; missing starter roots remain visible while the processor serves other triggers.
- [x] Native strategy reports actual OS watcher failure and never enters polling; README/reference updated.
- [x] Focused gates and behavioral negative controls recorded; independent source review has no blockers.
- [ ] Exact pushed-head independent attestation and required CI state recorded.
- [x] Assignment file excluded; lock changes limited to required dependency metadata.
