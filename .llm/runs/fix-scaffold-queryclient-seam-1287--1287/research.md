# Research — fix-scaffold-queryclient-seam-1287--1287

## Re-baseline

- Carried-in source: issue #1287 and the QueryClient boundary delivered for #1252
- Re-derived against `origin/main` @ `6c3b534fce31d261a378e4a17a6a6b6c9aabc8f8` on 2026-08-05
- What changed vs the carried-in version:
  - The SDK factory still erases a concrete TanStack `QueryClient` to a handwritten `QueryClientPort`.
  - The scaffold runtime check omits `apps`, where the catalog showcase exercises Fresh dehydration.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `createNetScriptQueryClient()` constructs `QueryClient` but declares `QueryClientPort` and casts at return. | `packages/sdk/src/query-client/query-client-factory.ts` |
| 2 | The handwritten port's updater signature is not structurally identical to TanStack's client. | `packages/sdk/src/ports/query-client.ts` and `deno check` fixture |
| 3 | The generated showcase calls both `prefetchQuery` and Fresh `dehydrateQueryClient`. | `packages/cli/src/kernel/assets/app/routes/examples/(_shared)/service-showcase.ts.template` |
| 4 | `generated.deno-check` omits `apps`, while generated `deno task check` includes it. | `packages/cli/e2e/src/application/gates/scaffold/database-gates.ts`; generated root `deno.json` |
| 5 | The docs teach an `as unknown as IslandQueryClient` bridge solely because of this erased return type. | `docs/site/web-layer/query-bridge.md` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/sdk/src/query-client/mod.ts`, `packages/sdk/src/mod.ts`, and `packages/sdk/deno.json` exports/imports.
- Slow-type / surface risks: return the named upstream `QueryClient` explicitly; retain existing public compatibility types and derive the narrow port from the upstream type rather than deleting exports.

## Open questions

- None. The generated workspace task is the authoritative scaffold check and provides the missing app coverage.
