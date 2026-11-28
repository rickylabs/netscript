# RFC 0013 Slice 1 Context Pack

- **Tracking RFC:** `rfcs/0013-orpc-v2-readiness.md` (issue #2672, accepted in PR #2674)
- **Slice Sub-Issue:** #2701 (`[rfc-0013 S1] Consolidate @orpc/* workspace catalog manifests, frozen-lock probes, and scoped CI compliance gate`)
- **Branch:** `chore/rfc-0013-s1-orpc-catalog-consolidation`
- **Base:** `origin/main` (`6c166075b`, Aspire 17 + RFC 0013 landed)
- **Phase:** Phase 0a (`0.0.10`, non-breaking prep on `@orpc/*@^1.16.6`)

## Design Checkpoint & Plan-Gate Disposition

- **Plan-Gate:** N/A (owner-approved RFC). Slice 1 executes accepted RFC 0013 §4.1 Phase 0a item 1 verbatim (`rfcs/0013-orpc-v2-readiness.md`, owner-accepted 2026-11-27 in PR #2674) with no new architectural decisions beyond the accepted RFC contract.

## Key Contracts & Invariants

1. All 11 workspace members remove hardcoded `"npm:@orpc/*@^1.16.6"` from `deno.json` `imports` and declare `"@orpc/*": "catalog:"` in `package.json` `dependencies` (matching `telemetry`, `plugin-sagas-core`, `plugin-triggers-core`, and avoiding both external-`--config` catalog lookup failures and `@deno/loader@^0.4.0` literal `"catalog:"` Vite SSR failures).
2. Publish-time materialization (`.llm/tools/release/publish-workspace.ts`) and local-source package copying (`packages/cli/src/maintainer/adapters/plugin-import-rewriter.ts`) materialize `package.json` `"catalog:"` dependencies into explicit `"npm:<pkg>@<version>"` `deno.json` `imports` so JSR consumers and local-source scaffolds preserve cold-cache Vite SSR resolution (#1006).
3. `packages/contracts/package.json` removes unused `@orpc/server` and stays strictly on `@orpc/contract` + `zod`.
4. Standalone `packages/cli/e2e/fixtures/desktop-native/` retains explicit `npm:@orpc/{client,contract,server}@^1.16.6` import map + frozen `deno.lock` (`check:desktop-native-fixture` and `deps:check:reference-locks` stay green).
5. All three isolated frozen-lock tests seed from active catalog-locked `@orpc/*` specifiers and use distinct absent `npm:@orpc/client@1.16.5` as their frozen rejection control before pruning stale `1.15.0`/`1.15.5` lock entries.
6. `deps:check` runs `scan-npm-catalog-compliance.ts --fail-on-package-prefix=@orpc/` (covering `deno.json`, `package.json` plain semver pins, static imports, and literal dynamic imports, with Windows-safe nested-config exclusion) and is wired into the required `quality` job in `.github/workflows/ci.yml`.
