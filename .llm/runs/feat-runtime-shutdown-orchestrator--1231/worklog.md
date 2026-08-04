# Worklog — feat-runtime-shutdown-orchestrator--1231

## Design

### Public surface

- `createRuntimeHost(options): RuntimeHost`
- `RuntimeHost`, `RuntimeHostOptions`, `RuntimeHostDrain`, phase/state/outcome/report contracts
- `RUNTIME_HOST_SHUTDOWN_PHASES` as the finite ordering vocabulary

### Domain vocabulary and lifecycle

- Lifecycle: `running → shutting-down → stopped`.
- Phases: `service → workers → queue → database`.
- Drain outcome: `stopped | failed | timed-out | skipped`.
- Identity: caller-supplied unique drain id.
- Failure: normalize rejection, continue; timeout active drain, skip remainder.

### Ports and effects

- Internal budget-timer port is injected into the runtime for deterministic tests.
- System timer implementation lives in an adapter; drain callbacks are caller-owned ports over
  existing resource handles.

### Constants

- `RUNTIME_HOST_SHUTDOWN_PHASES` derives `RuntimeHostShutdownPhase`.
- Default budget is a named internal constant.

### Commit slices

- S0 research/design/PR bootstrap.
- S1 contract, runtime, timer adapter, tests, README.
- S2 docs caveat/debt closure and final evidence.

### Contributor path

Add a resource by wrapping its existing stop method in one `RuntimeHostDrain`, assigning one of the
four named phases. New phases require changing the single phase tuple plus contract/tests/docs.

### Deferred scope

Signal listener abstraction, forced drain cancellation, new drain implementations, and Aspire
process control are intentionally absent.

