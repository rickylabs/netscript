# Worklog

## Design

Public surface: ChildHealthProcessOptions process/hostname/cleanup options; ServeOptions process-signal ownership; optional PluginServiceContext disposal callback at owner composition edges. Domain states: existing child health and shutdown report; process exit constants clean=0/fatal=1/timeout=2. Existing ports retained, no new generic registry.
Lifecycle: signal -> stop intake/drain -> bounded owned resource cleanup -> remove signal listeners/health server -> defined process exit. Library manual stop remains callable and does not terminate an embedding host.
Contributor path: child presentation edge, service shutdown coordinator/listener, generated host bootstrap and per-plugin glue. Tests colocated at lifecycle seams with subprocess boundary assertions.
S1-S4 and gates are enumerated in plan.md. PLAN-EVAL selected: runtime exit semantics and generated ownership cross package boundaries.

## Evidence

- Current base confirmed after fetch.
- Deno KV alone exits without explicit close; real Redis subprocess regressions are being run before product modification.
- rtk/rg unavailable; commands run directly as node. No operator environment values retained.

## Baseline reproduction

The first probe could not connect because the Docker daemon is in a different network namespace; that harness failure is not counted as a reproduction. Fixed endpoint discovery and made the watchdog tolerate an already-exited child. No product code changed.

With the isolated Redis endpoint reachable, both child cases (clean and hung drain) reach PROBE_READY, receive SIGTERM and fail the 5 s subprocess watchdog: structured tests exit 1, 0 pass / 2 fail. Both service cases likewise reach readiness and fail the 5 s exit watchdog: 0 pass / 2 fail. The retained concrete handle is the ioredis primary connection opened through getKv(). Deno KV alone was a negative control and exited normally. Child cleanup callbacks are deliberately ignored by current main, producing the expected red baseline.

Teardown preview planned no mutations; unrelated resources were left alone. Owned Redis cleanup uses exact creation identity plus run label and repository bind-mount verification.

## PLAN-EVAL cycle-one repairs

Evaluator accepted reproduction and coverage but returned FAIL_PLAN for five underspecified decisions. Plan now explicitly locks Deno.exit on clean and failed process-owned paths; Prisma dedup/disposal in raw withDatabase, inherited by presets; closeKv() rather than lazy context KV close(); bounded OTel flush without process termination and documented standalone behavior; and per-slice file groups (all below 30 files). Service's default 30 s total includes 25 s work and 5 s reserved cleanup; manual stop/external abort remain embeddable. No production code has changed. Cycle-two PLAN-EVAL is required before implementation.

## S1 regression baseline and plan approval

PLAN-EVAL cycle two PASS: https://github.com/rickylabs/netscript/pull/2641#issuecomment-6923762411. All five requested plan repairs accepted; no product implementation preceded approval. New focused regression run at unchanged main source: 9 pass, 2 fail. Child default bind reports 0.0.0.0 instead of 127.0.0.1; OTel exits 0 before the composing runtime's drain/exit 7. Real Redis subprocess baseline already records four watchdog failures. Signal subprocess cases explicitly skip Windows (SIGTERM-specific acceptance).
S1 commits the red oracles and accepted plan; S2 will make these regressions pass. Tests requiring new cleanup contracts are added after those contracts exist. No resources remain from reproduction.

## S2 core lifecycle implementation

Added explicit child shutdown ownership, loopback hostname override, monotonic total work/cleanup deadlines, and exit codes 0/1/2. Service signal paths reserve cleanup within the total deadline, call singleton-aware closeKv(), disconnect every registered raw-builder DB identity once, and terminate explicitly. Manual stop/external abort and exitOnSignal:false leave process-owned resources to their host. Cleanup invokes all registered resource callbacks even if work or another cleanup hangs. OTel's bounded signal shutdown no longer exits the process.

| Gate | Result |
| --- | --- |
| Real Redis child/service clean and timeout subprocess tests | exit 0, 4/4 pass; formerly four watchdog failures |
| Child bind/fatal snapshot, service coordinator, OTel focused tests | exit 0, 15/15 pass |
| Expanded cleanup/coordinator tests | exit 0, 8/8 pass |
| Existing listener/builder/runtime embedding tests | exit 0, 34/34 pass |
| Structured targeted type-check | exit 0, no diagnostics |
| Structured lint / format | exit 0 / exit 0 after correcting require-await in test stubs |
| quality:gate (quality:scan + arch:check) | exit 0 |

Resource teardown preview remained read-only. Owned Redis was removed after exact identity, run-label and bind-mount proof; no foreign or unknown-owner resources changed. S2 adds explicit exitOnSignal:false to two existing embedded signal tests; their hook/listener assertions are retained. Plan file groups updated to 17 (<30) to include these necessary test adaptations and post-contract cleanup tests.
Reconcile: PR remains a draft, status progresses to implementation, source for excluded saga transports is unchanged. S3 composition/docs and the one-pass runtime smoke remain pending; no supervisor sign-off is claimed.

## S3a generated resource ownership

Added optional, idempotent owner disposal to PluginServiceContext without resolving unused adapters. Generated host bootstrap tracks only acquired Prisma identities; its callback attempts every disconnect once. Workers/sagas/auth service composition invokes it in reserved signal cleanup; workers/sagas/triggers child glue calls singleton closeKv and the generated host callback. Saga DB acquisitions are covered through their existing host resolver. Native embedded hosts retain ownership on manual stop. Explicit host DB disposal disables duplicate automatic raw-builder disposal.

Generated-owner tests first failed 2/37 with missing disposal against the old embedded template. After canonical gen:assets-barrel, the suite passes 37/37, including all three installed runtime artifacts, acquired/unused generated DB cases, lazy owner disposal and a real signal proving exactly one disconnect. Structured changed-source check passes (14 files); non-CLI lint/fmt passes with no findings. CLI files require the repository's explicit CLI quality config because the root config excludes them; separate wrappers validate them. No lock changes or new dependencies.
Reconcile: #2630/#2631 acceptance implementation is progressing; generated runtime smoke, documentation/assets and independent IMPL-EVAL remain. No foreign resources are running for this slice.

## S3b public behavior documentation

Documented child loopback/hostname overrides, total and reserved cleanup budgets, explicit exit codes 0/1/2, manual/external embedding semantics, host database ownership override and OTel standalone signal behavior. Expanded the generated child-health page from the public option/function JSDoc, so its operational text stays source-derived. Public prose contains no run/evaluator/finding identities.

Docs:accuracy passes. Release:preflight initially detected package self-imports inside the new subprocess test strings; tests now resolve their local source module explicitly, and preflight passes. Child seam tests still pass 4/4. This is a test import correction, not a gate exclusion. Source remains within approved runtime scope. Documentation generator carriers are refreshed after committing the read set, then the full one-pass runtime smoke runs.

## S3b generated consumers and final static gates

Canonical agent prose/site generation passes. Refreshed MCP export-surface corpus, CLI assets and publish assets; both corpus and publish freshness checks pass. Export generation used its documented --allow-dirty option only for the already-generated prose carrier; all hand-authored inputs were committed and the warning named that sole derived input. No lock changes. Reference layouts were restored after the Markdown formatter caused broad table churn, leaving only semantic shutdown additions in the PR diff.

Final quality:gate, docs:accuracy and release:preflight pass. Service full export-map doc lint passes with zero diagnostics. Plugin doc lint has 18 pre-existing private-type diagnostics; telemetry has 7 (6 private-type, 1 missing JSDoc). Measured the identical command and per-entrypoint/file distributions at base b0eb07957 in a detached baseline checkout. Changed plugin health/SDK entrypoints are clean. JSR audits: service, telemetry and CLI exit 0 (existing warnings); plugin dry-run succeeds but audit exits 1 for three pre-existing missing @module tags in untouched abstracts/config/testing entrypoints. Git diff of those three entrypoints against the base is empty. These unrelated baseline findings are not hidden or fixed in this runtime slice.

Next: one full scaffold.runtime smoke with cleanup, resource ownership audit, final independent IMPL-EVAL and head checks. #2632 is ready for review separately at head deb6b21cfcfc6b9d94e7291eb21def7072b4539b with required checks PASS/SKIPPED and no unanswered threads.


## S4 runtime validation follow-up

First full scaffold.runtime attempt exited 1 before changed runtime roles: preflight.deno, preflight.aspire, scaffold.init and cleanup.aspire-stop passed; behavior.documented-scaffold timed out waiting for PostgreSQL readiness. Native diagnostics showed PostgreSQL accepting connections but local health checks unable to reach the remote Docker namespace. An owned-only temporary bridge made the native readiness check pass without product changes; the diagnostic AppHost was stopped. The corrected one-pass smoke is running.

The broader service/plugin tests exposed two legacy expectations: manual defineService.stop must preserve the host database under the approved contract; Deno watch reports explicit exit 1 as "Process finished with exit code 1" rather than "Process failed". Updated those assertions while retaining database usability/explicit owner disposal and watch failure/restart-history assertions. Targeted format/lint pass. No production behavior changed in this follow-up.

Broader package regression suite after the expectation updates: structured service/plugin tests exit 0, 820 passed / 0 failed / 4 ignored (824 results). Both updated test files pass structured format and lint with zero findings.


Corrected full scaffold.runtime exited 1 at plugin doctor: the maintained Docker topology contract explicitly rejects remote Docker for generated AppHosts. Native describe proved PostgreSQL, Redis, Garnet, users, workers API and workers healthy through the temporary bridge. This is partial runtime evidence, not a full smoke PASS. The temporary bridge also attached to the owned Aspire network and caused persistent-network cleanup to fail; the bridge is stopped and its residual ownership is audited separately before final cleanup. Further full local reruns are not useful on this unsupported topology; the supported CI runner must supply the complete runtime verdict. No doctor or test guard is disabled.

Final quality:gate exits 0 after both expectation updates. Baseline-only diagnostics remain disclosed above.

Resource reconciliation: teardown preview with an absolute worktree root planned one owned diagnostic PostgreSQL container removal. Apply removed that one container and no AppHosts/processes; exit 4 reports 40 foreign/unknown entries left untouched. Docker identity scans afterward found zero containers with owned-root mounts and zero uniquely labelled temporary bridge containers. The script's best-effort cleanup encountered a proxy already removed by Aspire; the error is retained, with the zero-survivor scan supplying final cleanup evidence.


## IMPL-EVAL cycle one and hostname delivery repair

Independent Muse Spark 1.3 xhigh evaluation returned FAIL_FIX: no complete supported runtime verdict yet (F1), and generated glue did not deliver the native hostname override (F2). Implementation lifecycle logic otherwise matched the accepted plan. Full verdict preserved in evaluate.md and https://github.com/rickylabs/netscript/pull/2641#issuecomment-6925186816.

Resolved the deferred S4 hostname decision with a dedicated generated-launch environment variable: workers/sagas/triggers pass NETSCRIPT_CHILD_HEALTH_HOSTNAME to the existing native hostname option. Unset preserves loopback. Custom API callers still set the explicit option; no shared-library environment fallback or generic HOSTNAME convention was added. Aspire's generated children run as host executables and retain loopback probes; containers can explicitly widen their listener.

Added generated-hostname subprocess tests executing all three emitted entrypoints and probing native HTTP through a non-loopback IPv4 interface for the widened case. At base b0eb07957: 3 pass/3 fail (defaults incorrectly bind all interfaces). At pre-repair PR source: 3 pass/3 fail (environment override ignored, non-loopback connection refused). After forwarding: 6/6 pass. Combined with installed-artifact tests: 31/31 pass. The preload observes the native bound address and HTTP response before database/job bootstrap; it does not replace application handlers. All subprocesses exit and temporary fixtures are removed. One initial probe also checked an unrelated bootstrap state; corrected that oracle to verify bind/HTTP reachability only before counting the genuine red result.

Hostname repair gates: structured changed-file check/lint/fmt pass with zero diagnostics/findings; release:preflight and docs:accuracy pass. Source-derived child health page regenerated.

Hostname repair consumer refresh: canonical agent-docs prose/site build, export corpus (documented --allow-dirty for the sole regenerated prose carrier), CLI assets and publish assets completed. Export and publish freshness checks pass. No lock changes or additional CLI embedded diff. Final-head supported runtime CI is requested after this consumer commit.


## Supported runtime CI failure and targeted cleanup control

Supported-runner head a142ac632 dispatch https://github.com/rickylabs/netscript/actions/runs/43929577301 passed the documented skip-seed-handoff behavior control with resident worker preserved, then failed in native Aspire persistent-resource cleanup (one persistent resource reported failed). Post-stop owned-survivor assertion did not fail; terminal native stop exit remained nonzero, so the gate correctly stayed red. This is not counted as a runtime PASS.

A targeted native cleanup control on the already-generated owned diagnostic AppHost reproduced the same normal-stop plus forced exact-AppHost-stop sequence without a port bridge: both native commands exit0, no owned containers in the final probe. Teardown preview preceded it and all commands target the exact owned AppHost. This does not reproduce the CI cleanup error and does not justify weakening cleanup assertions or forcing a product change. Requested one failed-job re-run with native workflow debug logging at the same head to obtain a terminal verdict and more diagnostics if it recurs. No full local scaffold.runtime repeated.


## Supported-runner baseline comparison

Unchanged main comparison [43936107382](https://github.com/rickylabs/netscript/actions/runs/43936107382) passes the Postgres runtime suite but fails SQLite at the same database.generate web-resource restart as the candidate's Postgres retry. Both generate the client and refresh the users consumer before native Aspire resource restart returns nonzero. The candidate's SQLite suite passes. This establishes that the restart symptom also occurs without the lifecycle changes; no unrelated product change or weakened gate is justified. Cleanup passes on both comparison runs. One additional failed-job run at unchanged final candidate head is justified by this crossed baseline result; a complete supported Postgres verdict remains mandatory.


## S4 native restart diagnostic control

Supported candidate Postgres run continues to fail database.generate at web-resource restart after55passing gates; cleanup passes. Main SQLite comparison reproduces the same symptom, while main/Garnet Postgres passes. No product cause is inferred from this crossed evidence. The refresh command discards the native restart exit code/stdout/stderr, preventing diagnosis. Add two genuine red tests on the unchanged-main CLI error path (stderr and stdout fallback); both fail because the native detail is lost. Minimal repair preserves Aspire exit code and diagnostic, retaining the scoped manual remedy. Full adjacent refresh suite14/14 passes, scoped typecheck/quality:cli/release:preflight/docs:accuracy pass. This changes failure observability only; lifecycle/drain contract and runtime gates intact. One new supported final-head smoke is required to obtain the decisive native error or a complete pass; no blind rerun or weakened gate.


## S4 supported runtime complete

[Workflow43951994678](https://github.com/rickylabs/netscript/actions/runs/43951994678) SUCCESS at sourceheadd6ef1fa71. Postgres124/124, SQLite116/116 plus showcase8/8, scaffold-static and desktop-native all succeed with cleanup assertions intact. Earlier native web-restart symptom also reproduced on main's SQLite lane; no new runtime root cause was established and no retry/bypass added. Native exit/detail preservation remains covered by two genuine red->green tests and adjacent14/14refresh cases. Both cycle-one evaluator findings now repaired: F1full supported smoke green; F2generated hostname forwarding6/6, installed31/31 plus full generated-health readiness200. All7issue acceptance boxes have final linked proof. Next independent feature IMPL-EVAL cycle2 at evidence-only followup head; production unchanged from green sourced6ef1fa71.


## Independent cycle-two implementation approval

[MuseSpark1.3/xhigh IMPL-EVAL PASS](https://github.com/rickylabs/netscript/pull/2641#issuecomment-6929922874) at582372c4a, observed requested OpenCode Go primary route, separate family/session from OpenAI generator. F1/F2 both independently verified: supported full124/116+8smoke, generatedhostname6/6 and owned realRedis subprocess4/4. Independent service131filecheck/child4filecheck/lint/fmt/quality/architecture/preflight/accuracy pass; service doclint0/plugin18/telemetry7 baseline unchanged. All7acceptance boxes and4+3evidence mapping verified. Current draft required checks policy-skipped; threadgate0/0. Retain verdict and transition ready, then confirm current head required gates. No production change after green source d6ef1fa71, no merge/ready-merge/publication.


## Ready-transition public type closure repair

Current CI shard1 receipt (workflow43960706867, job133627460342) reports786pass/1fail/9ignored: the existing workers non-contract doc-lint test exposes ServeOptions.onCleanup reaching private ShutdownHook through the worker facade. Reproduced that existing test locally red before fixing. Cleanup is always the process-owned signal disposal phase and needs no reason argument: narrow the new onCleanup contract to zero-argument disposers, leaving reason-aware work hooks on onShutdown. This avoids increasing the separately bounded workers/streams native type closure debt. No executable control flow, generated launch or budget changes. Existing worker public contract suite plus service resource ownership tests7/7green; scoped type check/lint/fmt0; release:preflight/docs:accuracyPASS. Supported full smoke and independent cycle2 remain behavior evidence because the delta is type/JSDoc only. Refresh generated documentation carriers before final head CI confirmation.


## Final type closure independently approved

Fresh separate-session [MuseSpark1.3/xhigh narrow IMPL-EVAL PASS](https://github.com/rickylabs/netscript/pull/2641#issuecomment-6930828469) at source212a8d39463b89a11551dff7e8b8f036a899e302. Independent public/resource7/7, service74file check/lint/fmt0, service doclint0 and worker service facade0, preflight/accuracyPASS. Prior full supported scaffold smoke and cycle2 remain authority for unchanged executable behavior. Current source head22SUCCESS/13SKIPPED, required checks pass/policy-skip, threadgate0/0. Retain cycle3 verdict with this evidence-only commit; production source unchanged. No merge, ready-merge or publication.
