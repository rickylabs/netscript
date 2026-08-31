# Worklog: #1452 Slice 1 — lazy KV primitive and scaffold adoption

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-plugin-service-context-host-factory--1452` |
| Branch | `feat/kv-lazy-plugin-context` |
| Archetype | `2 — Integration` (`packages/kv`); `6 — CLI/Tooling` carrier (`packages/cli`) |
| Scope overlays | none |

## Design

Recorded before implementation on 2026-08-31. `PLAN-EVAL: N/A`: this is a mechanical extraction
whose contract, behavior, ceiling, and gates are fixed by the existing template class and
`WatchableKv` interface.

### Public Surface

- `createLazyKv(config?: SharedKvConfig): WatchableKv` from `@netscript/kv` root.
- No new subpath, CLI command, binary flow, plugin surface, or package dependency.

### Domain Vocabulary

- `WatchableKv` — existing package-owned port returned by the factory.
- `SharedKvConfig` — existing typed configuration passed unchanged to the first `getKv()` call.
- Lazy resolution promise — per-instance memoized promise created on the first forwarded operation.

### Ports and adapters

- Consumed port: existing `WatchableKv`; no new port.
- Resolver/composition edge: existing `getKv(config)`; no module-load-time call.
- Adapters: unchanged. Tests use a recording `WatchableKv` fixture following existing in-memory
  adapter conventions.
- CLI spine/layer-2 abstracts, vertical features, extension axes, registries, command/process/fs
  ports, and composition files: unchanged and not introduced by this asset-only carrier edit.

### Constants

- None. This slice introduces no finite variant vocabulary or magic identifiers.

### Generated output and semantic test strategy

- Generated output: `services/_shared/plugin-service-context.ts` imports `createLazyKv` and uses
  `kv: createLazyKv()`; the local `LazyPluginKv` class and its type-only imports disappear.
- Semantic assertions: prove no resolution at construction; one resolution at first use; one
  resolution across two operations; exact argument/result forwarding for CRUD, list, watch,
  watchPrefix, close, supportsWatch, and `[Symbol.asyncDispose]` → `close()`.
- Required permissions remain those of the selected adapter and are deferred until the first
  operation, exactly as in the reference class.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Publish and prove `createLazyKv()` | scoped KV check/lint/fmt; KV tests; doc/JSR/quality gates | `packages/kv/application/lazy-kv.ts`, KV barrels, `packages/kv/tests/lazy-kv_test.ts`, run artifacts |
| 2 | Adopt the primitive in the scaffold and refresh the carrier | focused CLI template tests; scoped CLI check/lint/fmt; asset/export corpus gates | service-context template, `embedded.generated.ts`, run artifacts |

### Deferred Scope

- `@netscript/plugin` → `@netscript/kv` dependency ruling — architecture decision required.
- Full host factory location/API — depends on that ruling.
- Project-relative DB-client resolver injection — public contract decision required.
- `appsettings` — no current contract exists to implement.
- Slice 2 generated-consumer runtime boot proof — meaningful only after the above decisions.

### Contributor Path

Callers import `createLazyKv` from `@netscript/kv`. Maintainers change forwarding behavior in
`packages/kv/application/lazy-kv.ts`, update the focused test, then regenerate the CLI asset carrier
if the scaffold template changes. New KV adapters remain behind `getKv()` and require no lazy-wrapper
change.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-31 | bootstrap | re-baseline | Clean expected planning head; current main verified; lock hash recorded. |
| 2026-08-31 | design | ready | Doctrine, archetypes, public surface, reference class, and test conventions inspected. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Extract to KV application layer | The wrapper owns only `WatchableKv` + `getKv` behavior | plan LD-1/LD-2; doctrine A8/A10 |
| Preserve exact reference forwarding shape | Avoids semantic drift in every generated consumer | plan LD-3; template class |
| Keep Slice 2 untouched | Three public architecture questions remain unresolved | research; owner ceiling |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| RTK binary named by the repo skill is absent on this host | minor | yes |

## Gate Results

All gates are `NOT_RUN` until implementation lands. Durable/static evidence will be recorded here,
including non-empty stdout checks for cacheable check/lint/fmt receipts.

## Handoff Notes

- Review the template diff for strict import/class/construction-only change.
- Review the lazy test's observation points before trusting happy-path operation results.
- Confirm no `packages/plugin/` path and no `deno.lock` bytes changed.
