# Worklog

## Owner routing override (verbatim)

> Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only. Feature-tier loop: at most 2 PLAN-EVAL rounds and 5 IMPL-EVAL rounds. The final IMPL-EVAL must review the exact pushed head and end with one line: VERDICT: MERGE <full sha> or VERDICT: CHANGES <full sha>.

## Bootstrap

- Read the complete assignment, issue body and comments. No triage report or existing PR found.
- Consulted prior committed environment and validation memories before inspecting source.
- Consulted NetScript MCP find_guidance then search_docs for queue recovery semantics.
- RTK unavailable; use focused raw commands and structured gate wrappers.
- Operator-specific no-closing-keyword and no-taxonomy rules take precedence over generic dispatch defaults.
- No local scaffold.runtime E2E; coordinator owns the expensive gate.

## Design

1. Public surface: optional context.extendVisibility(ms?), ListenOptions.maxDeliveries;
   RedisAdapter.reclaimExpired(), getMetrics(), getHealth(); existing constructors preserved.
2. Vocabulary: claim receipt, lease deadline, delivery count, retry limit, durable DLQ outbox,
   reclaimed/deadLettered counters. At-least-once delivery; application effects stay idempotent.
3. Ports: existing MessageQueue, MessageContext, DeadLetterStorePort; ioredis command client.
4. Constants: 30_000ms default lease, 5 default deliveries, bounded page/poll/retry constants;
   existing DLQ reason vocabulary reused. Redis TIME owns the lease clock.
5. Commit slices: plan; atomic lease contract/runtime/adapter/tests/docs; final evidence/fixes.
   Files and gates are listed in plan.md; all slices update this file and context-pack.md.
6. Deferred scope: listener concurrency (#2351), other providers, telemetry exporter plumbing.
7. Contributor path: packages/queue/README.md documents options, heartbeat, recovery, metrics,
   durability and extending the internal lease transaction seam.

Reconcile (plan): issue remains open, no duplicate PR, coordinator-owned taxonomy untouched.

PLAN-EVAL round 1: FAIL_PLAN on claim contention, poison input, legacy adoption and
settlement ambiguity. Revised plan locks all four, including real regressions. No code edited.


## Terminal plan-gate decision

- Round 1: FAIL_PLAN. Revised blocking pickup, raw/poison input, legacy adoption and
  stale/ambiguous settlement semantics before round 2.
- Round 2, same evaluator: FAIL_PLAN. Remaining blockers are shared-key transaction
  contention and healthy-stamp/adoption ownership/grace rules. See plan-eval.md for both
  complete verdicts and plan.md for a concrete proposed correction.
- Two-round limit reached. No third evaluation, implementation, IMPL-EVAL or readiness claim.
- Baseline focused wrapper: 7 passed, 0 failed, exit 0.
- Baseline real-Redis delayed-promotion wrappers: 14 passed, 1 ignored, 0 failed, exit 0.
- Redis and Garnet backends were provisioned independently and responded to TIME/LPOS.
  These setup checks do not prove the requested fix; all acceptance remains unproven.
- Run-owned backend processes stopped at handoff. No foreign resources changed.
- Reconcile: draft PR #2483 remains open; no labels/milestones changed; coordinator #2474
  owns the next decision. Assignment and final-report files excluded from commits.


## Authorized resumption — 2026-10-31

Coordinator authorization: https://github.com/rickylabs/netscript/pull/2483#issuecomment-6536979349

> Authorized: a fresh PLAN-EVAL cycle, at most 2 rounds, on your revised per-claim fence and recovery-grace design, in this draft PR. Keep both earlier verdicts in plan-eval.md and use the same separate Opus 5.5 evaluator session. Implementation starts only after a PLAN-EVAL PASS.

Latest user instruction: more work remains, keep going and mark ready when done.
Both prior FAIL_PLAN verdicts are retained. New cycle uses the same evaluator; no waiver
of acceptance, independence, or final exact-head evaluation. NetScript MCP consulted again.

Second-cycle design replaces rejected WATCH proposal with atomic Lua pickup+lease,
receipt-fenced grace-aware reclaim and legacy orphan observation. Cancellable 50ms idle
polling, unchanged sequential listener structure, durable outbox/counters. No dependencies.
Garnet probe rejects XAUTOCLAIM; transactional Lua works. Document both required Lua flags.

New cycle round 1 FAIL_PLAN: Lua prerequisite would break generated Garnet defaults.
Resolved in plan by expanding generator/test scope to enable both Lua flags in Container,
Executable and Auto paths, with existing-project migration docs. New cycle round 2 pending.

Authorized cycle round 2: PASS. Independent evaluator confirmed both generator launch
functions cover every Garnet arm, including Auto fallback. Implementation now authorized.
Reconcile: no code yet; scaffold CI verdict is required and coordinator will be notified.

## Implementation proof before independent review

- Core acceptance tests: 10 passed on real Redis 7.0.15 and Garnet 2.2.1 (Lua transactional).
- Whole queue suite: 131 passed, 2 CI-only sentinels ignored; exit 0.
- Safety/compatibility/lifecycle focused suite: 26 passed, including a separate Garnet with
  Lua disabled proving that unsupported configuration never removes ready work.
- Infrastructure generator: 25 passed for both managed Garnet launch functions and Auto arms.
- Negative control: old main Redis adapter restored temporarily; all 10 core tests fail at
  runtime, with failures specifically on redelivery, missing heartbeat and stuck attempt 1.
  The implementation restored in finally; full passing rerun follows.
- Structured check: all 64 queue TS files and two changed CLI files pass (66 files).
- Queue lint: 64/64 processed, 0 findings. CLI lint: 2/2 processed, 0 findings, using a
  standalone config because root intentionally excludes CLI; no gate targets dropped.
- Quality gate durable receipt: quality:scan + arch:check/dependency checks exit 0.
- Scoped JSR audit/dry-run: dry-run OK; cardinality advisory recorded as explicit debt.
- Full-export doc-lint: exactly the existing WatchableKv private-type-ref, also present with
  old adapter restored; 0 new missing-JSDoc diagnostics. No unrelated KV change.
- Architecture debt delta recorded in redis-lease-cardinality, with cost/owner/closing gate.

Final restored implementation plus adjacent generator suite: 182 passed, 2 CI-only sentinels
ignored, exit 0. Publication checks preserve the single verified baseline KV documentation issue.
Checked the pinned Garnet commit Dockerfile: ENTRYPOINT is /app/GarnetServer with no CMD
arguments, so adding Lua flags does not replace hidden default port/index command arguments.
Source: https://github.com/microsoft/garnet/blob/b0255a31de95b1e903ee187feb59ceb04819a639/Dockerfile

Self-review found dangling deadline-index entries could occupy the bounded recovery page.
Add an atomic missing-record prune (rechecks absence in-script), plus real Redis/Garnet
100-dangling-entry regressions. This is part of the bounded recovery seam, not scope expansion.

IMPL-EVAL round 1: FAIL_FIX on transient transport ending consumption, external DLQ errors
ending consumption, and terminal reason priority at the last delivery. All addressed:
listener readiness/pickup retry availability loss with capped cancellable backoff; settlements
remain bounded; broken ioredis generations are replaced from duplicate() options; external
outbox flush is single-flight and independent from lease recovery/consumption; terminal
requeue:false preserves reason. Add real TCP proxy outage (4 seconds) and startup cancellation
tests, healthy-next-message during DLQ outage, and last-delivery reason tests. Proxy outage
plus safety suite now passes 18 tests on real Redis/Garnet.

After all I1–I3 fixes: combined queue + both generator suites PASS, 190 tests passed,
2 CI-only sentinels ignored, exit 0. Real TCP outage tests prove consumption after a
four-second disconnection; startup cancellation and lost-ack generation replacement pass.
Additional source/API/static gates are rerun on this reviewed working tree.

IMPL-EVAL round 2 found I1b: settlement during a handler outage still ended consumption.
Context ack/nack now use the same cancellable availability loop, while transport attempts
and standalone operational settlements remain bounded. Fences turn expired retries into
counted no-ops; a handler's own error still propagates after its fallback nack.
Real Redis/Garnet busy-handler outage tests now prove both continued consumption and delivery2
after expiry. Outage+compatibility suite: 16 pass, 1 optional no-Lua probe skipped in that run.
Feature-tier IMPL-EVAL limit remains 5 rounds; next is round3, same evaluator.

IMPL-EVAL round3 PASS: the independent evaluator re-ran its own busy-handler outage probe on
Redis and Garnet and confirmed continued consumption, delivery2 and counted stale ack.
It independently ran 16 core/outage tests with zero failures. No remaining blockers.

Final local combined queue+generator result: 192 passed, 2 CI-only sentinels ignored, exit0.
Structured check68files, queue lint66files, queue fmt66files, CLI lint/fmt2files: pass.
Redis-only and ports documentation gate now both exit0 after completing public type exports;
the full package still has the separately verified unchanged KV private-type-ref baseline.
JSR audit/publication dry-run OK; F16 navigation debt explicitly recorded.

Reconcile before implementation sign-off: PR #2483 is still draft; no labels/milestones,
locks/caches or foreign resources changed. Commit/push implementation and run evidence;
mark ready now that preliminary independent review has no blockers. Required scaffold-runtime
CI is coordinator-armed; final evaluator must inspect the exact pushed head. No merge here.

## CI follow-up slice — generated MCP public API corpus

CI quality failed solely at MCP export corpus freshness after lint/fmt/docs/prose checks passed.
Run the canonical deno task gen:mcp-export-corpus on clean committed package sources.
Exactly three generated rows change: queue root, queue Redis adapter and the worker surface
that references queue types. No runtime or test source changes and no manual generated edits.
Freshness durable gate PASS, 7 embedded-corpus/flow tests PASS, assets-barrel and publish-assets
freshness PASS. No lock changes. Push this necessary generated-data slice and run exact-head
IMPL-EVAL round5; keep the independent-evaluation checkbox unproven until its new verdict.

Reconcile: PR remains ready, not draft. Coordinator-owned e2e-cli-gate still absent; required
scaffold-runtime CI remains unproven and its acceptance stays unchecked. No labels/milestones
changed, no local scaffold runtime and no merge/release.


## Rebase and review follow-up design checkpoint

User explicitly authorized rebasing onto latest main and force-pushing. Rebased onto
4aa734e2b6ca93119462ec2e0cd34b729df51bfd, retaining the landed worker retry/DLQ feature.
Only conflict was the generated MCP corpus: preserve base then regenerate canonically.
Use force-with-lease against the previously observed remote head, after validation.

Augment review identified four valid gaps; all are in scope of working worker recovery:

1. Public surface: optional broker delivery generation and owner token on worker idempotency
   claims; optional token on completion/release. First-party dispatch owns renewal and cancellation.
2. Vocabulary: broker generation identifies a replacement delivery of the same message; owner
   token fences an older handler's marker mutations. Applied markers remain authoritative.
3. Ports: existing queue MessageContext heartbeat, KV atomic checks, TaskExecutionOptions.signal.
4. Constants: worker lease 60 seconds, renewal 20 seconds, three bounded CAS claim attempts.
5. Slice: transport timeout spelling plus logical deadline members and real backend negative
   controls; worker contract/store/dispatch integration and process/subprocess regressions;
   generated corpus and final independent exact-head review.
6. Deferred: no listen concurrency redesign, exactly-once effects, unsafe sequential KV takeover,
   taxonomy mutation, or local scaffold.runtime. Downstream effects still need idempotency.
7. Contributor path: worker/delivery-lease.ts for lifecycle; store README documents marker tokens.

Before fixes, missing-reply and keyPrefix tests failed on Redis and Garnet: four failures,
with six existing outage tests passing. Structured check/lint/fmt cover 101 files after fixes;
56 existing worker/retry/store and queue review tests pass on both backends. Cancellation
helper tests cover false/error renewal and initial ownership loss (3 pass).


Review proof: 7 real worker integration tests pass; restoring the old worker port/store and
job/task dispatch produces 7 runtime failures (4 killed-process replacements, 2 healthy long
subprocesses, 1 atomic takeover/fencing test). Type-checking was deliberately disabled only
for the negative control because the tests exercise the new optional contract. The initial
negative attempt stopped at type errors and is not counted as functional proof. All source
was restored in finally. Missing-reply/keyPrefix negative controls separately fail four
behavioral tests on both backends with the previous implementation.

The first expanded run passed 274 tests and exposed one operator-cancellation regression.
Explicit operator cancellation must ACK without DLQ; lost queue ownership must requeue.
WorkerDeliveryLease.lost now distinguishes these causes. No acceptance or test was weakened.

Core worker combined-export doc lint reports exactly two baseline private-type-ref diagnostics
in unchanged contracts/v1/workers.contract-types.ts. Restoring all pre-review worker source
and rerunning the same command reports the identical two diagnostics. Publication dry-run
passes. This baseline is separate from the already recorded KV doc diagnostic.


Final combined review-fix run: 275 passed, 0 failed, 2 CI-only sentinels skipped (exit 0).
It includes the full queue suite, worker store/concurrency/retry policy, worker runtime tests,
real crash/long-subprocess integration, and both generator suites. MCP corpus tests add 7 pass.
Structured check/lint/fmt cover 101 files without dropped files or findings. Native MCP corpus
freshness, assets barrel and publish assets checks pass; corpus regenerated from final sources.
Sign off and push the rebased fix slice; final independent exact-head review and remote CI follow.


## Round5 W1 correction

Final independent review returned CHANGES at 1edb71e: explicit requeue by throwing exhausts
WorkerListenerSupervisor's lifetime restart budget on Redis. Fix the authorized code before
requesting a fresh evaluation cycle: job/task queue retry paths explicitly nack and return;
pre-claim disabled/missing task errors retain main's ACK behavior. Claim-store failures and
failed successful-effect persistence still requeue. Direct non-queue consumers retain rejection
for replay safety. Task listener catches unexpected dispatch errors with explicit nack.

No change to Redis listen concurrency, supervisor policy or restart limits. The existing job
DLQ outage test now expects two normal handler returns and zero rejections, while retaining
its two execution/write attempts, exactly one durable DLQ record and zero pending/processing
assertions. Real task-subprocess shutdown now asserts explicit nack and normal handler return.
Four new real Redis/Garnet task-survival tests fail on reviewed source, then pass with the fix.
A further lost-job-lease test per backend covers the same policy on the job listener.


CI check-test-shard test-4 at 1edb71e has 1459 passed, 1 failed, 5 ignored. Downloaded its
structured test.report.json artifact: generated-helpers-compile_test.ts fails because the
minimal restored SDK fixture omits container withArgs. The capability is already used for
DenoKv containers and documented by Aspire.Hosting 13.5.3 at
https://aspire.dev/reference/api/typescript/aspire.hosting/withargs/.
Add the explicit withArgs(string[]) contract, retain strict methods, add Container-mode Garnet
fixture coverage, and assert emitted Lua flags. This repairs the fixture's incomplete API
model rather than relax compilation or change the working production launch method.


Corrected combined suite:281 passed,0 failed,2 CI-only sentinels skipped. A first rerun had
two test-only assertions using the wrong listener name (job:jobs vs actual jobs:jobs); corrected
the test and reran the full command to green. All six new survival tests pass on both backends.
Worker check/lint/fmt32files pass; quality/architecture/deps and native MCP corpus freshness pass.
Generated helper compile + generator suites52pass; final compile test rerun1pass. The two
legacy inline standard-library imports in that touched fixture now use workspace aliases, so
its scoped lint and typecheck pass without suppressions or root formatting changes.

Sign off/push the concrete corrected slice. Exact corrected-head independent review remains
unproven: authorized round5 returned CHANGES on the prior head and the feature cycle is exhausted.
Coordinator action required: authorize a fresh cycle in the same evaluator session and arm the
required scaffold-runtime CI label. No self-certification, sixth round, local scaffold E2E,
labels/milestones, merge or release in this run.


## Continued CI remediation after corrected-head handoff

Owner continuation instruction, quoted verbatim:

> PR #2483 is NOT mergeable — CI is RED: close-gate failed. Don't sit idle on a red PR. Run  gh pr checks 2483  then  gh run view <run-id> --log-failed  to see the real cause, fix it, and push. For a deno_core/check-* 'MISSING — baselined but not seen' message the cause is test DISCOVERY, not a code bug. Auto-merge fires only when ALL checks are green.

The owner requests continued remediation after the prior exhausted-cycle handoff. Continue as a
bounded corrective validation cycle, same feature tier and independent evaluator/session, with
an exact-head check of the shipped W1/SDK fixture correction. Preserve the historical five-round
cycle and its CHANGES verdict; do not relabel it as approval or erase findings. No new framework
source change is needed unless a real gate identifies one. Record this steering before launch.

Ran gh pr checks and gh run view --log-failed as requested; the latter cannot return aggregate
logs while test-4 is running. The completed close-gate job log identifies only unchecked exact-head
review and full scaffold-runtime proof. Native agentic:pr-checks confirms current-fail on this
head, with quality, typecheck, command-postgres and other completed shards passing. No discovery
MISSING diagnostic is present. Use e2e-cli's checked-in workflow_dispatch path at the frozen
branch head to obtain the required full runtime proof without changing coordinator-owned labels
or running local scaffold.runtime. Complete actual evidence before updating acceptance and rerun
close-gate on the same evaluated head.


Corrective cycle review1 returned CHANGES at da79e722bf64168a19c382e2bcf9336d03984a15.
W2: native Deno KV's requeue nack is a no-op; normal handler return acknowledges the message.
Restrict explicit nack-and-return to contexts with the lease capability; preserve rejection for
non-lease/native Deno KV and direct calls. Apply consistently in job/task dispatch and listener.
Two real in-memory Deno KV regressions (job DLQ storage outage and task shutdown/replacement)
fail at runtime before the fix, then pass. Combined targeted native-KV and Redis/Garnet survival,
job DLQ/retry suites:33 passed. Restore the pre-existing non-lease KV outage test's rejection
expectation; Redis's zero-restart survival proof remains unchanged.

Manual e2e-cli41162244034 reaches runtime tiers but exposed desktop-native's pre-existing
launcher lookup bug. Latest main manual e2e-cli40539973506 fails identically: installPackage
truncates the native runtime path and attempts to stat a nonexistent dotted-version launcher.
This is a real CI harness failure, not a queue or packaging product change. Locate the unique
other executable beside the installed runtime instead, rejecting missing/ambiguous candidates.
The regression uses a different dotted-version stem and a non-executable renderer asset; all
three boundary cases pass. No skip, exception label, workflow rewrite, or product weakening.
Full runtime proof will be rerun at the eventual frozen corrected head; old-head runs are diagnostic.


W2 and manual-CI corrective slice gates:285passed,0failed,2CI-onlyskips in the combined full
queue/worker/store/retry/generator/compile/native-launcher suite. Structured check106files,
queue/worker lint100files, CLI lint2files, worker fmt33files and CLI fmt2files all pass with
zero findings. Native quality/architecture/deps and MCP corpus freshness pass. Public API
signatures unchanged; no generated corpus rewrite needed. Commit/push this slice, then
manual full CI and same-session corrective review2 at the exact final head. Do not move that
head for evidence-only comments/checklist updates after review.


Full manual CI at966c3ef: PostgreSQL scaffold.runtime PASS, static PASS, desktop check PASS
under unchanged active#859 staged-update callback exception. SQLite has50passed/1failed:
runtime.aspire-start cannot converge because Garnet finished and dependents wait. Latest main
manual control40539973506 passed both runtime tiers. The SQLite uploaded report includes only
readiness state, not the failed process's console error; do not guess at dependencies or args.

Focused local diagnosis (not scaffold.runtime): exact generated dotnet toolrun flags work,
and a minimal isolated Aspire13.5.3 AppHost launching only Garnet2.2.1 with the same deferred
port/args callback reports Running/Healthy. Lua is bundled in the pinned tool. Both owned probe
processes and the exact isolated AppHost were stopped. This does not replace the remote SQLite gate.

Preserve bounded terminal-resource console logs on convergence failure: expected resources only,
max3resources,5second command bound each,80lines and6000character tail. Retrieval failure leaves
the original convergence verdict failed; no restart, retry or timeout relaxation. Six injected
startup-diagnostic tests, scoped typecheck/lint/fmt pass. Push this diagnostic-only slice and
rerun manual CI at its exact head to capture the actual environment-specific error if it recurs.
