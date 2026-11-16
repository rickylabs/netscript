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
