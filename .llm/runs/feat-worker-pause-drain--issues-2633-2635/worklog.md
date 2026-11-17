# Worklog

## Design

Research is active; required behavior and must-resolve lifecycle/budget/accounting choices are in plan.md. Existing Worker lifetime currently conflates listener cancellation and active job abort; queue/runner ownership boundaries must be named before a repair. Feature Plan-Gate selected. No production changes or reproduction claimed.

Fresh main b0eb07957 fetched before branch. Both full issues and relevant public docs/APIs read. Initial source spot-check confirms missing pause/resume, immediate abort at stop and ineffective later30second work wait. Core runner docs confirm1second grace. Next complete backend inventory and functional red tests.


## Research and red contracts complete

All running findings reproduced as listed in research.md; corrected Postgres harness excludes the concurrent schema race. Actual Worker replacements on Redis/Garnet fail at count2 on first restart; ordinary requeue controls pass. AMQP baseline upstream double acknowledgement blocks its accounting oracle and is explicitly scoped as prerequisite, with confirmed-publish and native-cancel plan locked. Four active owned backend containers and the earlier Garnet startup replacement removed by immutable identity after leak/teardown preview; no foreign cleanup. Deno info introduced one exact-version specifier alias in deno.lock; removed only that incidental line, preserving the original lock. No product changes.

## Design

Core owns named idle/running/paused/draining/stopped lifecycle, monotonic disposable clock, total25s budget, default5s abort cleanup and1s settlement reservation; plugin wires existing queues/supervisors/runner. Per-attempt intake pause barrier preserves execution signals and lease renewal, start lifetime, task coverage and resumed concurrency. Explicit preserveDeliveryCount nack defaults false; shutdown first-cause only, fenced/idempotent one-refund handback. Config/schema/native loader and both standard runtime constructors forward data-only budgets into the real runner. No helper agent, no dependency on the separate process-shutdown PR. plan.md enumerates ordered <30-file slices, runtime/failure/concurrency/durability cases and all publication/fitness/runtime/consumer gates. Separate feature PLAN-EVAL required before production.


## Independent Plan-Gate PASS

[GLM5.3/provider-default independent PLAN-EVAL PASS](https://github.com/rickylabs/netscript/pull/2645#issuecomment-6931112123) at89effd610:8/8Plan-Gate,9/9acceptance coverage, no production edits, separate session/family confirmed. Retain verdict. Correct S6 documentation path to tune-worker-runtime.md and name generated carriers; pin committed claims racing pause to ordinary charged requeue (preservation is draining/shutdown only), with an S4 race oracle. These are evaluator bookkeeping/advisory repairs, no architectural re-plan. S2 may begin.


## S2 core contract and receipt settlement

Public contracts first: core ./shutdown named lifecycle/monotonic disposable clock/default total25s/default grace5s/resolver and fixed work-abort-settlement primitive; queue NackOptions.preserveDeliveryCount defaultsfalse, requeue-only. Redis/Garnet handback encodes the refunded envelope in the existing atomic fenced receipt transition, bypassing limit exhaustion only on that explicit live handback; expiry recovery remains charged. Postgres generates an opaque per-claim locked_by receipt, atomically refunds/unlocks within the live fence, guards ack/release and once-only settlement. Simplified existing envelope/DLQ plumbing reduces touched Postgres581->568lines. No new schema/dependency/command/Streams.

Independent implementation-lane slice review: diff follows approved boundaries; no orphaned timers, root/barrel mirror, hidden lifecycle registry or generic transport abstraction. The ordinary default nack stays charged. Core tests assert19s work plus5s cleanup plus1s settlement share one monotonic25s deadline and clear timers. Native tests prove repeated8handbacks, max-limit bypass, terminal preservation ignored, duplicate/stale/expired contexts cannot refund/remove newer receipts. Closed Redis contexts legitimately reject AbortError; the test pins that safe outcome and unchanged newer claim rather than requiring reopening.

Validation: structured live Redis/Garnet/Postgres suite28pass/0fail/0ignored (shutdown requeue + refund races + existing Redis lease cases); budget/Postgres adjacent8pass/0fail; scoped check/lint/fmt0; core shutdown doclint0; release:preflight fourPASS and docs:accuracyPASS. Original config/runner/Worker reds remain pending S4/S5, other adapter reds pending S3. Three positively owned backend containers retained for following slices, immutable IDs/mounts privately recorded; foreign resources untouched.


## S3a portable native/KV/memory handback

Memory and native Deno KV explicit handback preserve envelope identity/count once, ordinary requeue and thrown-handler failures charge. Native Deno KV publishes before native ack and closes retained contexts on automatic success; failed persistence still throws to native recovery. KV polling extracts private message/key and settlement modules; claims get opaque receipts, CAS move refunds only owned live entries, explicit settlement suppresses automatic duplicate settlement, stale/expired callbacks cannot affect replacements. Active deliveries use independent identities so immediate handback cannot corrupt concurrency bookkeeping. Failed settlement previously escaped an unjoined async callback; new fault test red (uncaught settlement outage) before fixing listener failure propagation with durable processing entry retained. Stop cancels the local listener even when given an external signal; per-generation failure closures cannot abort a later listener. KV polling shrinks811->727lines. Existing private terminal fixture now installs its claimed row before settlement, retaining its terminal/DLQ assertions under fencing.

Gates:9/9local handback/count controls;9/9duplicate/terminal/late-context guards;22/22adjacent lifecycle/DLQ/memory/outage tests; scoped check/lint/fmt0; queue combined doclint1 and exact per-entrypoint baseline unchanged; preflight/accuracyPASS. Three positively owned backends remain active for the next slices, immutable identities/mounts retained privately.

## Pause-barrier discovery and scoped plan follow-up

Running listener-drain-owner_test.ts reveals Redis/Garnet and KV polling resolve their listener after a native visibility-based wait even while the callback remains active.500msheld callback vs50msnative limit:3proposed-owner cases red,3ordinary-default controls green,0ignored. The initial200ms polling observation was near the100ms cadence and is excluded. This would invalidate a long pause barrier despite independent execution signals. Added plan-intake-drain-addendum.md locks an explicit optional listener drain owner budget (Infinity only under the Worker's separately bounded25s total), default finite behavior unchanged. No added-option implementation before independent PLAN-EVAL follow-up. No AMQP or Worker lifecycle implementation yet.


## Listener ownership addendum approved

[Fresh GLM5.3/provider-default PLAN-EVAL PASS](https://github.com/rickylabs/netscript/pull/2645#issuecomment-6931962078) approves the added optional listener drain ownership contract at014730e1c. Independent KV polling default control green / owner case red, source-verified native Redis timeout, core worker25s total boundary and all three forwarding sites;8/8Plan-Gate,9/9continued acceptance. Evaluator settled one wording repair: docs/JSDoc distinguish per-listener post-intake cutoff from same-named Worker total stop option. No implementation waiver or gate reduction. Retain verdict; implement S3b contract/native adapters next. Corrected the verdict's final-line head transcription to the exact evaluated head already stated in its metadata.


## S3b listener drain ownership

Approved optional ListenOptions.drainTimeoutMs separates Redis/KV-polling post-intake waiting from worker total stop. Omission preserves native visibility-based finite behavior. Positive Infinity leaves admitted callbacks/receipts alive for an outer bounded owner; no Infinity timer is scheduled. Invalid finite/nonfinite values rejected before allocation. Listener JSDoc explicitly cross-references WorkerOptions.drainTimeoutMs, whose total remains finite25s by default. No visibility/claim/reclaim/Lua change.

Previously red owner/default controls now6/6green on real Redis/Garnet and KV polling; combined with existing native lease suite16pass/0fail/1pre-existingCI-only ignore. Policy validation/no-allocation1/1green; scoped check/lint/fmt0, release:preflight/docs:accuracyPASS. AMQP work is independent and follows in its own commit; Worker forwarding is S4.


## Original S3 AMQP handback

The pinned provider's non-native async path double-acknowledged; replace consumption with existing upstream amqplib basic.cancel/prefetch and one per-receipt settlement boundary. Configure the existing Fedify enqueue path with the actual queue name and native retry. Preserve/count the same envelope on an owned confirm publisher and await broker confirmation before old ack. Native error/cancel/close callbacks are owned, retained contexts cannot publish through a closed receipt, and stop closes the owned connection even after listen already completed. No new dependency or fake provider seam.

Real backend handback suite23/23 executes all seven backend variants (Redis/Garnet/Postgres/AMQP/DenoKV/KVpoll/memory),8shutdown restarts, explicit and actual thrown failures plus native DLQ tests,0ignored. After channel-edge cleanup strengthening, focused AMQP/policy5/5green. Scoped check/lint/fmt0, new private method JSDoc supplied; queue combined doclint1/exact per-entrypoint baseline unchanged, no newdiagnostics. Preflight/accuracyPASS. Four owned implementation backends now retained, each immutable ID and mount recorded privately; no foreign cleanup. Worker integration follows S4.


## S4: pause generations, bounded stop and shutdown-only handback

Worker now owns explicit lifecycle state, independent intake generation cancellation and one total monotonic drain. Jobs/tasks/triggers pass the approved infinite backend-listener wait while the Worker owns its finite total. Pause keeps admitted signals alive and start pending; resume joins the old generation before admitting replacements. Stop is terminal/idempotent, guards late startup allocation, waits work before abort, then joins runner/listeners and closes identity-deduplicated queues. Health records healthy intentional pause. Top-level grace takes precedence over the supported legacy pool setting.

Portable nack preservation is used only when the observed first failure is the worker shutdown reason. A business failure observed before retry backoff cannot be reclassified by later shutdown; the core retry helper now retains that earlier error. Earlier deadline/operator cancellation stay charged. Two core red tests reproduced first-cause rewriting before that change; four real dispatch controls prove charged attempts.

Structured full Worker suite plus core cause tests:113pass/0fail/0ignored, including actual Redis and Garnet eight-restart tests. Intake lifecycle8/8 covers all three families, pause/resume overlap, claim races, terminal stop and bounded held startup. Focused abort lifecycle7/7 retains terminal status, exact reentrant completion, released claims and once-only cleanup. Scope moved those relevant cases out of the legacy1195-line dispatch test into a272-line focused file. Existing KV outage fixture observes portable explicit nack instead of thrown-handler retry; attempt2/write2/finalzero assertions retained. Hung progress may exhaust cleanup and return bounded TimeoutError, which its fixture validates. Redis fixture total raised100->500ms because the unchanged native disconnect grace is100ms; eight restarts/count/DLQ controls unchanged.

Scoped161-file formatter, check and lint wrappers:0findings. Plugin doc-lint combined2 and every entrypoint match measured baseline, including runtime2/worker0/services0. New lifecycle type is an identity export for runtime public closure. release:preflight fourPASS; docs:accuracyPASS. Four exact owned backend containers remain retained for subsequent slices. Configuration/default standalone runner changes and S6 documentation remain pending; no acceptance completion claim yet.

S4 quality:gate (quality scan + architecture fitness) exit0; no new doctrine exemption. Worker476lines, focused abort fixture272lines; legacy dispatch test reduced by241lines.


## S5 red contract and real runtime oracle

Before changing configuration/runtime forwarding, committed schema default/validation cases and isolated real-runtime subprocess cases. Executable final fixture uses a real project config module, dynamic user handler, native Deno KV queues, KV registry/execution state and both startWorkerProcess/startCombinedProcess. No static pool registry or mocked runner. An owned HTTP acknowledgement sink satisfies the unrelated execution mutation publisher. Handler requires1.25s post-deadline cleanup; the terminal state must remain timeout even when cleanup returns success. Authored50ms versus1800ms and explicit overrides both directions test actual reachability/precedence. Child processes and their temporary project/KV paths are owned and removed; no container started.

Final red report:4pass/6fail/0ignored. Both schema tests fail; all four short-grace cases observe cleanup awaited despite requested50ms, proving neither authored nor explicit grace reaches the runtime. Four long-grace controls pass under S4's new Worker-derived default. Initial fixture failures (missing unrelated streams reference and a project-relative dynamic entrypoint mistake) are excluded from product evidence, repaired before this oracle. The original committed core config/default>1s tests still cover the two main regressions.


## S5: configuration and standard runtime forwarding

WorkersConfigData and authoring/schema contracts expose validated total drain/grace, shared defaults derived from the core policy and grace<=total validation. Standalone InProcessJobRunner uses the same5s default with queue/Worker arithmetic in JSDoc. Runtime policy loading moved from CLI to the runtime folder, retaining an identity CLI export. Both standard startup APIs validate project policy and explicit overrides before runtime dependencies, and pass both durations into Worker regardless of static registry presence. Generated glue already delegates to combined startup, so it uses the same resolver.

Structured contract+runner+real runtime suite12/12green,0ignored: eight real subprocess cases cover both startup paths, authored50/1800ms and explicit precedence both directions with1.25s cleanup. Every terminal state remains timeout, never false success. Full workers core112pass/0fail/1pre-existingignore. Full core/plugin source/test check0; scoped lint0; canonical source/test fmt174files0. Core combined doclint2/plugin2 and all per-entrypoint distributions match measured baseline, config/shutdown0. release:preflight fourPASS and docs:accuracyPASS. Initial red fixture prerequisite failures excluded as recorded above.

S5 quality:gate exit0 (no new doctrine exemption or dependency/lock change).


## S6: public semantics and options

Updated the actual tune-worker-runtime.md guide and worker/core/queue READMEs. Documents pause/resume generation joins, healthy paused lifetime, terminal bounded stop,25s=19+5+1 arithmetic and duration validation/precedence, project/generated startup forwarding and standalone5s grace, parent headroom, shutdown-first-cause delivery preservation versus ordinary failures/pause races, at-least-once provider outage limitations and the distinction between listener post-intake wait and Worker total. Public docs contain product concepts only. Preserved unrelated Markdown formatting rather than expanding scope. docs:accuracyPASS. Manual docs committed before refreshing generated prose/export/asset consumers.


S6 canonical consumer refresh: gen:agent-docs-prose (site build/semantic checks included), gen:mcp-export-corpus with expected dirty prose carrier, gen:assets-barrel and gen:publish-assets all exit0. Only generated prose, MCP export corpus and MCP publish-assets carrier changed; CLI asset generation produced no diff. check:mcp-export-corpus and check:publish-assets exit0. No lock change or saga transport edits. A final S4 coverage supplement exercises actual Worker replacement on the five remaining adapters, complementing the original Redis/Garnet Worker oracle and seven-backend queue contract; it is a test-only coverage extension, not a design change.


## S4 coverage supplement and final-gate repairs

Added actual eight Worker replacements on memory/KVpoll/nativeDenoKV/Postgres/AMQP, complementing original Redis/Garnet instances. Stable message/header/count1 asserted at every delivery; ninth execution succeeds; final memory queue empty, KVpoll pending/processing/DLQ0, nativeDenoKV no extra delivery, Postgres row count0/DLQ0, AMQP message/consumer/DLQ0. Four cases green immediately; initial Postgres fixture used the wrong private test credential (excluded), then passed using the native configuration of its positively owned backend. No new dependency: test uses the existing locked AMQP version.

Final full suites initially queue213pass/2fail/3existingignores, plugin263pass/1fail/0ignored. AMQP abort unit fixture still supplied only the obsolete Fedify consume shim and failed before stop; updated to the native upstream channel contract, retaining connection-close assertion and strengthening exact cancel/channel/connection ordering. The reported Redis failure was collateral cancellation from that unhandled sibling failure; unchanged Redis test passes once AMQP fixture is corrected. Plugin seed-directory fixture consumed a queued initial mkdir notification after directory removal; it now requires live recreated-directory state before publishing. Watcher production code unchanged; no assertion removed. Combined corrected fixtures13/13green.

Startup audit found a real gap in the approved pause-during-initialization risk: first trigger listener could stay live while waiting on a second registry lookup. New test red before fix; runtime context now exposes current intake state so each trigger/task listener pauses immediately after allocation. Worker remains477lines. Intake/supervisor suite24/24green, including that held-lookup boundary. This implements the original startup/pause contract; no design or budget change. Full suites rerun after these repairs.

The startup regression now covers pause both before and after the first trigger allocation while a second lookup is held. Initial allocation-only state application passed the first window but left the second red (1pass/1fail); immediate transfer of every new listener into the Worker's existing ownership list closes both windows. One narrow onListenerStarted context callback handles ownership and current-state application; no generic lifecycle registry. Final intake/supervisor25/25green. Static/check/fmt and public surface gates rechecked after this final composition fix.

Final queue suite215pass/0fail/3existingoptional-backend ignores. All newly added accounting/ownership cases execute against provisioned backends. Final90-file check/lint/fmt0; plugin doclint2 at the exact baseline entrypoints; MCP corpus freshness and quality:gatePASS after final ownership repair. Full plugin rerun remains in progress; no full-smoke/evaluator or readiness claim yet.


## S7 final local gate set and supported runtime dispatch

Final full plugin266pass/0fail/0ignored, full queue215pass/0fail/3unchanged optional-backend ignores, full core112pass/0fail/1unchanged ignore. All new native/backend/Worker replacement cases executed; no new skip. Final source check/lint/fmt0, quality:gate/architecture fitness0, corpus/publish freshnessPASS, release:preflight fourPASS, docs:accuracyPASS. All three native JSR publish dry-runs succeed; the final plugin dry-run repeated after startup ownership repair succeeds. Audits report existing cardinality warnings and miscount the normal slow-type-check banner as one warning; native publish has no slow-type diagnostic. Existing dynamic-import warnings remain in unchanged import sites. Doc-lint combined core2/queue1/plugin2 and exact per-entrypoint baseline preserved; new config/shutdown entries0. No lock/dependency, forbidden transport or Streams change.

Full supported one-pass scaffold runtime workflow dispatched once at source2d7aa10448700b46cb1c2dbb4665044eafb60dfa: https://github.com/rickylabs/netscript/actions/runs/43984548275 . Native Aspire guard remains intact; no local guard bypass or bridge. Run was in progress at dispatch verification and is not claimed green. Evaluator and final readiness must distinguish completed local evidence from this pending external gate.

Fresh matrix confirms feature IMPL-EVAL primary MuseSpark1.3/xhigh, fallback Opus5/xhigh (unused). T3 capabilities confirm OpenCode Go MuseSpark1.3 contributor with xhigh variant available. Generator CodexSol/xhigh is a different family/session. Matrix CLI rejects the operator-user flag; the documented read-only matrix invocation without that flag succeeded. T3 requires a fresh review delegate rather than same-session steering. No helper agents. Four exact owned backend containers remain available for evaluator probes; parent cleanup after evaluation is still required.


Implementation completion comment: https://github.com/rickylabs/netscript/pull/2645#issuecomment-6933353414 . Issues2633(4/4) and2635(5/5) acceptance now checked with linked local executable proof; PR body carries separate closing lines and4+5fenced mappings. Final DoD/readiness gate remains unchecked pending independent verdict, supported runtime and final checks/cleanup. Exactly one status:impl-eval; still draft. Review-thread gate0threads/0unanswered. Current artifact head's lightweight checks were in progress/policy-skipped, not claimed green. Product remains identical to2d7aa10448700b46cb1c2dbb4665044eafb60dfa.


## Independent implementation evaluation and external-gate triage

Fresh MuseSpark1.3/xhigh independent IMPL-EVAL PASS at79f35829e679e5ff0d2c62d0a1a9a62d2f1ae03e. Evaluator reran full queue215/0/3, plugin266/0/0, core113/0/0 (its broader environment executed the formerly optional case), static/fitness/JSR/docs/consumer gates and all9acceptance. Artifact evaluate.md retained unchanged. No implementation findings; external runtime explicitly uncertified and final DoD still pending.

Supported workflow43984548275 completed with static/native/SQLite runtime SUCCESS, Postgres FAILURE. Postgres failure is behavior.documented-scaffold's restored variant during db generate refreshing dashboard, after users refresh; first two documented variants and every owned cleanup assertion pass. The bounded error capture truncates native restart detail, so exact root cause remains unknown. This stage/symptom also exists on unchanged main: [baseline43936107382](https://github.com/rickylabs/netscript/actions/runs/43936107382), recorded with crossed candidate/main evidence in the runtime shutdown PR. That comparison predates this worker implementation and prevents inferring a worker regression from the refresh symptom alone. No bypass/assertion removal or speculative product fix.

A single failed-job-only rerun at the same immutable source is justified by the crossed baseline evidence and completed green alternate runtime/static/native legs. It retains the full one-pass command and cleanup assertions, rather than repeating every lane. The original failed attempt remains evidence, not a PASS. Owner authorization to complete required validation already covers necessary failure diagnosis/retry; the evaluator's suggestion to request fresh permission does not override that authorization. Final supported Postgres PASS remains mandatory before readiness.


Final resource cleanup completed after independent evaluation: four exact native container IDs and four recorded anonymous volumes removed after native label/mount verification, maintained read-only leak/teardown preview, and a full unreferenced-volume scan. Final owner/recorded-volume scans zero; every foreign/unproven resource retained. Sanitized leak-report.md records proof; raw logs/identities remain private. Supported SQLite116/116 +showcase8/8, static/native SUCCESS; Postgres-only unchanged-source retry remains pending. No worker source change after independent PASS.


## Supported runtime completion and ready transition

Supported full one-pass workflow43984548275 attempt2 SUCCESS at unchanged product source2d7aa10448700b46cb1c2dbb4665044eafb60dfa: Postgres124/124, SQLite116/116 plus showcase8/8, static/native and cleanup assertions intact. The original failed Postgres refresh attempt remains recorded above; exactly one failed-job-only retry passed without a code change or weakened gate. Independent Muse IMPL-EVAL PASS retained, no product delta. Final exact resource scan zero owned containers/recorded volumes; foreign objects retained.

PR2645 now ready for review, status:impl-eval, all9acceptance and final DoD boxes complete. Current non-draft head CI still has pending quality/check-test lanes, so overall task completion is not claimed. Close-gate and browser/command/docs/build lanes passed, other lanes skipped per workflow policy. Final required head checks and review-thread gate remain mandatory; no ready-merge or merge authorization.


## Required-head CI startup-log correction

Ready head4ed91e2d required CI found one failure in1753pass/1fail/21existingignores: the maintained worker-runner-docs guard expects the existing in-process startup log, inadvertently omitted during lifecycle refactoring. Reproduced locally1pass/1fail before correction. Restored the exact existing startup message before running-state initialization; no branch, wait, dependency, runtime wiring or drain change. Guard retained unchanged. Prior independent behavior PASS and supported smoke remain valid for unchanged control flow; focused validation and required-head CI must pass before completion.

Startup log correction gates: unchanged documentation guard plus intake/supervisor27/27green (including former1/1red), scoped source check/lint/fmt0, quality:gate0, release:preflight fourPASS and docs:accuracyPASS. One mistyped local test filename was corrected before any behavioral run; no empty run claimed green. Required-head checks rerun on the pushed correction, not inferred from local results. No new resource started.
