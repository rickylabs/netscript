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
