# Architecture

This document records package architecture decisions for `@netscript/fresh`.

Archetype: 4 (DSL/Builder)

`@netscript/fresh` is **Archetype 4 — DSL/Builder** per the doctrine archetype map
([`06-archetypes.md`](../../../docs/architecture/doctrine/06-archetypes.md)). Its public product is a
family of builders and typed contracts — `definePage()`, `defineRouteContract()`,
`defineFreshApp()`, and the form, query, and defer factories — that turn page and route intent into
Fresh runtime wiring. The root entrypoint is curated for small cross-cutting helpers; everything else
lives on named subpaths.

## Source layout

Implementation lives under `src/` in canonical doctrine role folders (Doctrine 05). The package root
holds only `mod.ts` and the re-export shells the CLI import map depends on (`server.ts`,
`builders/mod.ts`, `route/mod.ts`, `query/mod.ts`, `config/vite.ts`).

| Role               | Holds                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| `src/application/` | The builder DSLs and contracts: `builders/`, `route/`, `form/`, `query/`, `defer/`, `vite/`, `cache-entries/` |
| `src/runtime/`     | Behavior that runs: `server/` bootstrap, `streams/` durable-stream client, `interactive/` hooks |
| `src/diagnostics/` | `error/` normalization and error display primitives                         |
| `src/testing/`     | Route and defer test fixtures                                               |
| `src/internal/`    | Package-private telemetry                                                    |

## Subpath conventions

- Error normalization and display primitives live under `./error` (`src/diagnostics/error/`).
- Cache-entry loader helpers live under `src/application/cache-entries/` and are re-exported from the
  root entrypoint; there is no dedicated `./utils` subpath (the forbidden `utils/` folder name was
  removed during the Wave 5 consolidation).
- Vite integration stays under `./vite` (`src/application/vite/`).
- Test fixtures stay under `./testing` (`src/testing/`).
- Fresh telemetry uses one internal convention (`src/internal/`) shared by feature-specific helpers.

## Public surface stability

The published subpath keys are the contract. Root re-export shells let the implementation move into
`src/` without changing any consumer import or the NetScript CLI's local `PACKAGE_TO_LOCAL_PATH`
resolution. Oversized builder/page-compatibility modules are split into cohesive type modules under
`src/application/builders/define-page/` so no single file exceeds the doctrine size ceiling.
