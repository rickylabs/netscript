# Drift & Diagnostic Notes — RFC B (`plan/rfc-orpc-v2-readiness-2672`)

No framework runtime or build drift was encountered on `main` (`87965d800`).

## Pre-existing Dependency & Test Observations (`main` `87965d800`, source-inspected)

1. **Fragmented `@orpc/*` specifiers across workspace manifests & e2e tests:** `.llm/tools/deps/scan-npm-catalog-compliance.ts` already reports `WARN DEPS-NPM-CATALOG` across all 11 workspace `deno.json` manifests plus `packages/cli/e2e/fixtures/desktop-native/deno.json`, `install-generated-probe_test.ts`, `locked-probes_test.ts`, `service-query-utils-upstream_type.ts`, `client-contribution-observability_test.ts`, and `installation-provisioning_test.ts`. Phase 0a consolidates them onto `catalog:` and promotes the scanner check to fail CI.
2. **Stale `1.15.0` entries in root `deno.lock`:** `@orpc/client@1.15.0` and `@orpc/tanstack-query@1.15.0` remain in `deno.lock` with no active dependent, emitting a peer-dependency warning during `deno install`. Pruned in Phase 0a.
3. **Deno minimum-dependency-age policy (`1.16.6` vs `1.16.5`):** `1.16.6` (published 2026-11-25) is rejected on publication day by `minimumDependencyAge`; Phase 0a targets `1.16.5` (and refreshes the React fixture frozen lockfile so all 3 SDK fixture tests pass).
4. **Upstream repository migration:** oRPC's GitHub repository is `middleapi/orpc` (formerly `unnoq/orpc`). Phase 1 `chore/orpc-v2-shadow` CI tracks `middleapi/orpc` releases and npm `@orpc/*` dist-tags.
5. **Cross-RFC alignment with PR #2673 (RFC A):** Aligned RFC B's Phase 2 edge-index migration with RFC A Round-1 B3 (HTTP edge index retained on v1, migrated to native `RPCMatcher` + `OpenAPIMatcher` on v2) and B4 (per-invocation context-symbol idempotence guard against v2's middleware-dedup removal).
