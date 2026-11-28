# Drift Log — RFC 0013 S1

1. **Manifest `"catalog:"` placement (`deno.json` + `package.json` vs `package.json`-only):**
   - `rfcs/0013-orpc-v2-readiness.md` §4.1 suggested removing `@orpc/*` entries from member `deno.json` `imports` in favor of `package.json` `"catalog:"`.
   - Ground-truth check of `packages/sdk/tests/package-manifest_test.ts` (commit `6a7d2af99`, #1006) showed that JSR publishes `deno.json` (not `package.json`), and removing runtime dependencies from `deno.json` `imports` breaks clean cold-cache Vite SSR for JSR consumers.
   - Meanwhile, `.llm/tools/release/publish-workspace.ts` (`materializeCatalogImports`) already materializes `"<pkg>": "catalog:"` entries in `deno.json` `imports` into `"npm:<pkg>@<version>"` at publish time (already proven for `"zod": "catalog:"` across 18 packages).
   - **Resolution:** Replaced hardcoded `"npm:@orpc/*@^1.16.6"` entries in all 11 workspace `deno.json` manifests with `"catalog:"` (and synced `package.json` `"catalog:"` entries, removing unused `@orpc/server` from `packages/contracts/package.json`), updated `packages/sdk/tests/package-manifest_test.ts` to accept root-catalog-backed `"catalog:"` in `deno.json`, and updated `workspace.ts` + `scan-npm-catalog-compliance.ts` to validate `deno.json` `"catalog:"` entries against root `catalog`.
2. **Third frozen-lock probe test discovered:**
   - Beyond `locked-probes_test.ts` and `install-generated-probe_test.ts` listed in RFC 0013 §4.1, `.llm/tools/deps/check-reference-locks_test.ts:59-74` also seeded from stale `npm:@orpc/client@1.15.0` in root `deno.lock`. Updated all three tests together before pruning stale `1.15.0`/`1.15.5` entries from root `deno.lock`.
