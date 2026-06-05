# Runtime Gates

Runtime gates prove behavior that static checks cannot. They apply to
Archetype 3, runtime-bearing Archetype 5, some Archetype 6 commands, and scope
overlays.

## Gate Definitions

| Gate | Required when | Evidence |
|------|---------------|----------|
| Lifecycle start/stop | Runtime starts loops, watchers, workers, services, or CLI commands that spawn work | start evidence plus `stop()` or cleanup evidence |
| Cancellation propagation | Async IO or long-running loops are touched | test or trace proving `AbortSignal` path |
| Aspire health | Work changes distributed resources or service wiring | resource status/log evidence |
| Browser route validation | Frontend routes or UI workflows change | screenshot, route result, or Playwright/browser log |
| Trace/log review | Runtime behavior or rendering performance matters | relevant logs/traces with failures checked |
| Failure path | Supervisor, retry, handler, or adapter errors change | test or manual run proving error semantics |
| Generated project smoke | CLI/scaffold output changes | generated app check/run evidence |

## Runtime Evidence Bar

Evidence must include the actual route, service, command, or runtime surface.
"It compiles" is never runtime evidence.

## Scope Overlay Additions

- `SCOPE-frontend.md` requires real route/browser validation for changed UI.
- `SCOPE-service.md` requires service or Aspire validation when runtime
  behavior changes.
- `SCOPE-docs.md` may require no runtime gate unless docs assert runtime
  behavior.

## Failure Handling

Runtime failures are `FAIL_FIX` unless the needed runtime validation was outside
the approved plan or requires unavailable infrastructure. In that case, record
drift and use `FAIL_RESCOPE`.
