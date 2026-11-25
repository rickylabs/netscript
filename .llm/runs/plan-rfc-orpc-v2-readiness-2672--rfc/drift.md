# Drift & Diagnostic Notes — RFC B (`plan/rfc-orpc-v2-readiness-2672`)

No framework runtime or build drift was encountered on `main` (`87965d800`).

## Pre-existing Dependency & Test Observations (`main` `87965d800`, source-inspected)

1. **Fragmented `@orpc/*` specifiers across workspace manifests & e2e tests:** `.llm/tools/deps/scan-npm-catalog-compliance.ts` reports `WARN DEPS-NPM-CATALOG` across all 11 workspace `deno.json` manifests plus `packages/cli/e2e/fixtures/desktop-native/deno.json` and inline test pins (alongside unrelated non-`@orpc/*` warnings like `preact-render-to-string` and `@tanstack/ai`). Phase 0a consolidates workspace `@orpc/*` uses onto `catalog:`, updates isolated temp-dir lock tests (`locked-probes_test.ts`, `install-generated-probe_test.ts`) to read an active locked `@orpc/client` entry before pruning `1.15.0`, and scopes the CI catalog failure flag strictly to `@orpc/*`.
2. **Stale `1.15.0` entries in root `deno.lock`:** `@orpc/client@1.15.0` and `@orpc/tanstack-query@1.15.0` remain in `deno.lock` with no active dependent, emitting a peer-dependency warning during `deno install`. Pruned in Phase 0a after updating `locked-probes_test.ts` and `install-generated-probe_test.ts`.
3. **Deno minimum-dependency-age policy (`1.16.6` vs `1.16.5`):** `1.16.6` (published 2026-11-25) is rejected on publication day by `minimumDependencyAge`; Phase 0a targets `1.16.5` (and refreshes the React fixture frozen lockfile so all 3 SDK fixture tests pass).
4. **Upstream repository migration:** oRPC's GitHub repository is `middleapi/orpc` (formerly `unnoq/orpc`). Phase 1 `chore/orpc-v2-shadow` CI tracks `middleapi/orpc` releases and npm `@orpc/*` dist-tags.
5. **Cross-RFC alignment verified (PR #2673 `bd8d51c0` & PR #2659 `f8c8d8fd`):** RFC A (`bd8d51c0`) and RFC B are now 100% aligned on deferring implicit handler `CORSPlugin` removal to breaking `0.1.0`, retaining `contract-procedure-index.ts` on v1 and migrating to native `RPCMatcher` + `OpenAPIMatcher` at `0.1.0`, and using per-leaf + per-invocation `PIPELINE_EXECUTED_SYMBOL` guards against v2's middleware-dedup removal. Neither PR `#2673` nor PR `#2659` was touched during RFC B Round 2.
