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
holds only `mod.ts`; every published subpath in `deno.json` resolves directly into `src/`, with no
re-export shells in between.

| Role               | Holds                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| `src/application/` | The builder DSLs and contracts: `builders/`, `route/`, `form/`, `query/`, `defer/`, `vite/`, `cache-entries/` |
| `src/runtime/`     | Behavior that runs: `server/` bootstrap, `streams/` durable-stream client, `interactive/` hooks |
| `src/diagnostics/` | `error/` normalization and error display primitives                         |
| `src/testing/`     | Route and defer test fixtures                                               |
| `src/internal/`    | Package-private telemetry                                                    |

## Subpath conventions

- Error normalization and display primitives live under `./error` (`src/diagnostics/error/`).
- Cache-entry loader helpers live under `src/application/cache-entries/` and are the sole export of
  the root entrypoint; they are cross-cutting and belong to no single feature subpath. There is no
  dedicated `./utils` subpath (the forbidden `utils/` folder name was removed during the Wave 5
  consolidation).
- Vite integration stays under `./vite` (`src/application/vite/`).
- Test fixtures stay under `./testing` (`src/testing/`).
- Fresh telemetry uses one internal convention (`src/internal/`) shared by feature-specific helpers.

## Public surface

The published subpath keys in `deno.json` are the contract, and each one resolves straight to its
implementation in `src/` — there is no compatibility layer and no backward-compatible re-export
surface. The NetScript CLI's local `PACKAGE_TO_LOCAL_PATH` map points at the same `src/` targets as
the JSR `exports`, so locally-scaffolded apps and published consumers resolve identical modules.
Oversized builder/page modules are split into cohesive type modules under
`src/application/builders/define-page/` so no single file exceeds the doctrine size ceiling.
