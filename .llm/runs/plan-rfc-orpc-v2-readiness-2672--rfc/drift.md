# Drift & Diagnostic Notes — RFC B (`plan/rfc-orpc-v2-readiness-2672`)

No framework runtime or build drift was encountered on `main` (`87965d800`).

## Pre-existing Dependency Hygiene Observations (`main` `87965d800`, source-inspected)

1. **Fragmented `@orpc/*` specifiers across workspace manifests:** Root `deno.json` defines `"catalog"` entries for `@orpc/*@^1.15.5`, yet 11 workspace `deno.json` files hardcode `npm:@orpc/*@^1.15.5` instead of `catalog:`, and `packages/sdk/tests/type-fixtures/service-query-utils-upstream_type.ts` pins `@1.15.5` inline. Tracked in RFC B Phase 0.
2. **Stale `1.15.0` entries in root `deno.lock`:** Root `deno.lock` contains both `1.15.0` and `1.15.5` resolutions for `@orpc/client` and `@orpc/tanstack-query`, triggering a peer-dependency warning during `deno install` in the throwaway v2 prototype. Tracked in RFC B Phase 0.
3. **Upstream repository migration:** oRPC's GitHub repository moved from `unnoq/orpc` to `middleapi/orpc`; release monitoring and Phase 1 shadow CI should track `middleapi/orpc` releases and npm `@orpc/*` dist-tags.
