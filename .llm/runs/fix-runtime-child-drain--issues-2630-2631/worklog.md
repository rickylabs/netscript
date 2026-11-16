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
