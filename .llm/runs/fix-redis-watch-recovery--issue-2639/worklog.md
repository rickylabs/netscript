# Worklog

## Design

Current-state watch contract, live lease identity and lifecycle research are in plan.md. Initial state is connected; close enters reconnecting, successful SUBSCRIBE acknowledgement enters resynchronizing/connected, exhausted recovery enters failed, release/adapter close enters closed. Shared subscription owner supervises physical subscriber; individual watch queues own caller cancellation and typed failure propagation. Redis remains external clock/transport adapter; native retry/delay own bounded timing, all cleanup must cancel it. No new handler registry, port or global state.

Bootstrap only. No production changes or reproduction claimed. Next write/run genuine server-outage regression on unchanged main and lock plan before separate evaluation.


## Red runtime reproduction

Structured real Redis tests:0passed/2failed. Both reach subscriber end after the native retry window. Recovery case restarts the actual server and confirms PING, but iterator times out rather than reporting lost state. Terminal case times out after35seconds rather than throwing KvConnectionError. No product code changed. Test fixture uses a stable container endpoint while controlling its Redis server and removes only the exact owned labelled container. Short-gap test added next using native transactional kill+write, with no timing or publication dependency.

Short-gap oracle also fails on unchanged main: native MULTI kills exactly one real pub/sub connection then SETs the envelope before any resubscription; the next batch times out. This proves reconnect state loss without a mocked backend or a publication race. Total baseline: three distinct failing runtime regressions, no bootstrap failure. Final resource label scan empty.


## Independent Plan-Gate

Separate-session GLM5.3/provider-default PLAN-EVAL [PASS](https://github.com/rickylabs/netscript/pull/2644#issuecomment-6927438505), all8boxes; observed OpenCode Go route matches requested primary and differs from OpenAI generator family. No repairs required. Acceptance3/3 covered by genuine baseline regressions. Implementation watch-points retained in plan-eval.md: preserve typed failures through release, fence stale generations, snapshot bookkeeping, prefix lifecycle, owner-file size and retries throughout the30-second budget. S2 may begin; no production implementation yet.


## S2 contract first

Expose the existing KvError/KvConnectionError/KvClosedError identities from root and Redis entrypoints, with public module/class/constructor documentation. Regression test imports KvConnectionError from the published Redis entrypoint. No recovery implementation yet. Structured package check59files passes, doc lint zero, changed error-class lint/format pass. Native lifecycle tests remain intentionally red until the next implementation slice.


## S2 recovery implementation and regression gates

Retained the existing subscription owner and added bounded shared recovery: native short reconnect and ended-subscriber recreation explicitly SUBSCRIBE live channels, then invoke state rereads after acknowledgement. The30-second disconnect budget includes all native connection/restoration/snapshot retry work; last cause is preserved. Attempt cancellation fences late rereads and stale acquire cannot replace the active subscriber. Final lease release cancels pending work without removing a sibling. Expired/closed sockets never wait for QUIT/UNSUBSCRIBE during terminal cleanup. Existing failed primary/subscriber promises reset for fresh attempts.

Fixed-key state bookkeeping moved into a focused127-line adapter module, reducing redis.adapter.ts747->704lines. Snapshot reads buffer live messages, skip racing entries, preserve previousValue and never compare opaque stamps for order. Missing keys emit delete/null; recovery may repeat unchanged values. Queue failures interrupt idle/debounce waits, retain public typed error, and caller abort wins. Adapter close sends KvClosedError before closing sockets. Prefix discovery interval retained, with restored subscription and typed close/read failures. README/guide document these semantics.

Three original real baseline regressions now pass. Additional live coverage proves sibling preservation after native end, prompt final abort during a paused reread plus fresh watch, and restored prefix subscription/typed close. Queue unit cases prove typed debounce/idle failure and abort precedence. Final full KV run against isolated owned Redis plus enabled actual-server tests:250passed/0failed/2existingignored. Package check61files, scoped lint/fmt, quality:gate, release:preflight, docs:accuracy, doc lint zero and JSR dry-run/audit pass (one existing slow-type inspection warning). Exact identities/unique labels fence every test-owned cleanup; the full-suite Redis is removed in finally, foreign resources untouched. No dependency/lock/Streams/transport changes. Next canonical consumer documentation generation and independent IMPL-EVAL.


## S3 canonical consumer assets

After committing manual source/docs, generated agent prose, MCP export corpus, CLI asset barrel and publish assets in canonical order. Export generation used --allow-dirty only for the expected sole generated prose carrier, warning reviewed. Changed carriers are MCP prose, symbol corpus and publish assets; no CLI scaffold output changes. Corpus and publish freshness pass. No dependency/lock churn. All final source gates remain green; next independent feature IMPL-EVAL and current required head/review-thread gates.


## Final per-lease cancellation regression

Self-review found that returning a watch from a yielded batch while its recovery reread was paused could leave the shared recovery awaiting that released observer. Added a genuine failing test against the implemented S2 head, then gave each observer a cancellable lifetime. Returning one lease now detaches its pending reread without blocking a sibling or a new lease, including callers without their own AbortSignal. Focused red->green verified. Final full KV suite251passed/0failed/2existingignored with all7new real-server cases enabled. Structured61file check/lint/fmt and quality:gate pass. Two existing skips are the CI-only unreachable-backend test and the old externally supplied-container integration test; new acceptance cases do not skip. All exact-owned containers removed. Public contract/docs and generated symbol shape unchanged; verify freshness after the private cancellation correction.


## Final evaluation handoff

After the private per-lease correction, corpus/publish freshness, release:preflight, docs:accuracy and doc lint0 recheck pass. Review-thread gate0/0. Read-only leak report/teardown preview show zero owned cleanup commands; foreign resources left untouched. All3issue acceptance boxes now checked with linked final IMPL evidence and exact fenced acceptance mapping in the PR. Feature matrix confirms MuseSpark1.3/xhigh independent final route, fallback Opus5/xhigh unused. Final handoff commit updates run artifacts only; source remains ea85fb387 with251passing tests. No readiness/merge claim until final evaluator PASS and required head checks.


## Independent implementation verdict

[MuseSpark1.3/xhigh IMPL-EVAL PASS](https://github.com/rickylabs/netscript/pull/2644#issuecomment-6929229737) at93bf1a6bc. Observed OpenCode Go primary route matches request, separate session/vendor from OpenAI generator; no fallback. Evaluator independently runs scoped61file gates, quality/preflight/accuracy/doc lint0/JSR/freshness, focused10/0 actual-server+queue cases and full KV251/0/2; all acceptance3/3 and6plan watch-points plus per-lease race pass. One low non-blocking unrelated site-tooling note retained in evaluate.md. Final verdict-retention commit is evidence only. Ready transition/current required-head checks and review-thread gate next; no merge/ready-merge/publication.
