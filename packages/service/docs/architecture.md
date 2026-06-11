# Architecture

`@netscript/service` is an Archetype 4 builder package with Archetype 3 runtime behavior folded in.
The public surface is a fluent DSL, and the runtime surface is the `RunningService` listener handle.

## Folders

| Folder | Role |
| --- | --- |
| `src/builder/` | Fluent builder interface and internal implementation. |
| `src/primitives/` | Handler factories for health, RPC, OpenAPI, Scalar docs, and errors. |
| `src/presets/` | `defineService()` composition preset. |
| `src/diagnostics/` | Internal startup diagnostics. |

## Runtime Boundary

`build()` returns a non-listening `ServiceApp`. `serve()` is the only public path that calls
`Deno.serve`, and it returns a `RunningService` with explicit stop semantics.

## Public Types

Public types are structural mirrors owned by this package. Hono and oRPC remain implementation
dependencies rather than required public type imports for service callers.
