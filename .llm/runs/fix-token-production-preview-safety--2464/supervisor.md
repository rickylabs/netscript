# Supervisor

Task: #2464, next dependency-ready leaf under tracker #2412 after merged #2549.
Branch: `fix/token-production-preview-safety`. Baseline: `f4aa307b5340bd3de8029c11778a38bbca451ba1` (origin/main).
Tier: feature; implementation Codex. Routing queried through `deno task agentic:matrix --tier feature --json` (primary sol; fallback muse_spark_1_3). New independent evaluation will preserve separate vendor/session; the existing owner-requested read-only Claude Opus 5.5 high route remains the evaluation preference. Two consecutive failures stop this new leaf.

Authorized writes: this run directory; `packages/cli/src/kernel/application/tokens/clean-app-tokens.ts` and token tests; `packages/cli/src/kernel/templates/app/production-theme_test.ts`; app design-theme and layout/vite template files under `packages/cli/src/kernel/assets/app/`; only the registry/install/token metadata sources necessary to express preview availability; relevant focused tests and docs; generated CLI/publish carriers only through canonical generators. New helper files must be justified in the Design checkpoint before creation. Public evidence uses repo-relative paths and no session identifiers.

Scope boundaries: all three #2464 findings, no S3 overlap with active PRs #2488/#2538, no Figma restyle or release publication. No deletion of lockfiles/caches, rebase or force-push. Existing no-label preference retained; release milestone 0.0.9 already owns #2464.

Exact additional source surface: `packages/cli/src/kernel/assets/app/routes/(design)/design/(_shared)/theme.ts.template`, `packages/cli/src/kernel/templates/app/design-theme_test.ts` (new runtime regression), and `docs/site/web-layer/how-to/customize-fresh-ui.md`. Final generated carriers are generator-owned.

Test-only dependency wiring adds root `deno.json` import alias vite:catalog: and the required root lock metadata; CLI package dependency metadata stays unchanged. Compare all resolved versions/integrities before accepting any lock delta.

Root development import metadata is mirrored by `packages/fresh-ui/deno.lock`; add that maintained private lock to the authorized surface and refresh only through lock:update. Preserve all resolved versions/integrities.

Refined dependency surface: packages/cli/package.json declares vite as a catalog-backed devDependency. Root import aliases are removed because they contaminate isolated reference resolution. Lock metadata follows this final canonical test-only wiring.
