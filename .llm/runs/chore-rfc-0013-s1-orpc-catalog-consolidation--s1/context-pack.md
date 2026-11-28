# RFC 0013 Slice 1 Context Pack

- **Tracking RFC:** `rfcs/0013-orpc-v2-readiness.md` (issue #2672)
- **Slice Sub-Issue:** #2701 (`[rfc-0013 S1] Consolidate @orpc/* workspace catalog manifests, frozen-lock probes, and scoped CI compliance gate`)
- **Branch:** `chore/rfc-0013-s1-orpc-catalog-consolidation`
- **Base:** `origin/main` (`6c166075b`, Aspire 17 + RFC 0013 landed)
- **Phase:** Phase 0a (`0.0.10`, non-breaking prep on `@orpc/*@^1.16.6`)

## Key Contracts & Invariants

1. Workspace `deno.json` manifests use `"@orpc/*": "catalog:"` (matching `"zod": "catalog:"`), so JSR publish (`publish-workspace.ts` `materializeCatalogImports`) still materializes explicit `"npm:@orpc/*@^1.16.6"` into published `deno.json` manifests for clean Vite SSR consumers while keeping root `deno.json` `"catalog"` as the single version source of truth.
2. `packages/contracts/package.json` removes unused `@orpc/server` and stays strictly on `@orpc/contract` + `zod`.
3. Standalone `packages/cli/e2e/fixtures/desktop-native/` retains explicit `npm:@orpc/{client,contract,server}@^1.16.6` import map + frozen `deno.lock` (`check:desktop-native-fixture` and `deps:check:reference-locks` stay green).
4. All three isolated frozen-lock tests seed from active catalog-locked `@orpc/*` specifiers and use distinct absent `npm:@orpc/client@1.16.5` as their frozen rejection control before pruning stale `1.15.0`/`1.15.5` lock entries.
5. `deps:check` runs `scan-npm-catalog-compliance.ts --fail-on-package-prefix=@orpc/` so any workspace `@orpc/*` catalog regression fails CI without tripping on unrelated pre-existing warnings.
