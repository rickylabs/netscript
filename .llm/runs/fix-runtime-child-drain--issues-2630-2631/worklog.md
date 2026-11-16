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
