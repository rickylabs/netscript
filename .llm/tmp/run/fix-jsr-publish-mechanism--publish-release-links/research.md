# Research — fix-jsr-publish-mechanism--publish-release-links

## Re-baseline

- Carried-in source: user prompt plus current branch `fix/jsr-publish-mechanism`.
- Re-derived against `main` baseline stated by user (`97199040`) and current worktree on 2026-06-25.
- What changed vs the carried-in version:
  - No divergence found in the blocker: bare root `deno publish --dry-run` still fails with TS2305 in `packages/aspire/src/public/mod.ts`.
  - Existing repo gate remains per-member and slow-types-aware in `.llm/tools/run-publish-dry-run.ts`.
  - Current workflow still runs `deno publish` directly after the dry-run gate.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `.github/workflows/publish.yml` currently triggers on pushed `v*` tags and publishes with bare `deno publish`. | `sed -n '1,260p' .github/workflows/publish.yml` |
| 2 | The repo dry-run gate discovers publishable `packages/*` and `plugins/*`, materializes root npm catalog imports per member, and runs `deno publish --dry-run --allow-dirty` from each member cwd. | `sed -n '1,260p' .llm/tools/run-publish-dry-run.ts` |
| 3 | Only four packages are currently approved for `--allow-slow-types`: `packages/contracts`, `packages/plugin-triggers-core`, `packages/service`, and `packages/plugin`. | `.llm/tools/run-publish-dry-run.ts` |
| 4 | `packages/aspire/src/public/mod.ts` is not in Aspire's `exports` map; the root export is `mod.ts`, and exported subpaths are config/schema/types/constants/application/adapters/testing. | `sed -n '1,220p' packages/aspire/deno.json` |
| 5 | `packages/aspire/src/public/mod.ts` re-exports `AspireError`, `DuplicateContributionError`, `ReferenceSpec`, and `AspireRuntime` through internal barrels even though root `deno publish --dry-run` reports those members as missing. | `sed -n '1,160p' packages/aspire/src/public/mod.ts`; `deno publish --dry-run` |
| 6 | The underlying Aspire symbols exist in direct source files: `src/domain/errors.ts`, `src/domain/reference-spec.ts`, and `src/ports/aspire-runtime-port.ts`. | `rtk rg -n "AspireError|DuplicateContributionError|ReferenceSpec|AspireRuntime" packages/aspire` |
| 7 | No product TypeScript imports `packages/aspire/src/public/mod.ts`, but four plugin import maps point `@netscript/aspire` at that file. It must be retained and repaired, not deleted. | `rtk rg -n 'packages/aspire/src/public/mod\\.ts|@netscript/aspire' plugins packages -g deno.json` |
| 8 | Root dry-run failure reproduced on 2026-06-25: after checking workspace exports, slow-type validation fails with four TS2305 errors in `packages/aspire/src/public/mod.ts`. | `deno publish --dry-run` exit 1 |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned:
  - Workspace publish mechanism: root `publish` workflow and `.llm/tools/run-publish-dry-run.ts`.
  - Aspire JSR surface: `packages/aspire/deno.json` exports and `packages/aspire/mod.ts`.
- Slow-type / surface risks:
  - Real publish path is not the same mechanism as the green dry-run gate, so the gate is not a true predictor.
  - Bare workspace-root publish checks included internal files and fails on an internal Aspire barrel outside the package exports map.
  - Slow-type carve-outs must remain limited to the four accepted packages; blanket `--allow-slow-types` would hide new public-surface debt.
  - Release provenance depends on preserving GitHub Actions OIDC (`id-token: write`) and using `deno publish` without suppressing provenance.

## Open questions

- Should `push.tags` remain as a secondary publish trigger? Plan decision: no; the release event becomes the single automatic path, with `workflow_dispatch` as the explicit fallback.
- Should Aspire's internal `src/public/mod.ts` be retained? Plan decision: retain it because plugin import maps consume it, and repair direct re-exports because that is low risk.
