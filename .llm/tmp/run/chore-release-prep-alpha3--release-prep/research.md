# Research — chore/release-prep-alpha3 (release-prep for v0.0.1-alpha.3)

Baseline: `origin/main` @ `bc72364a` (post-#128 Deno 2.9 adoption). Re-baselined this session.

## Goal

Land the two remaining release-blocking pieces on `main` **before** publishing the JSR
`0.0.1-alpha.3` release, so the release actually (a) refreshes the live docs site with the new
version and (b) keeps CI green through the workspace version bump.

This is the concrete realization of task #112 ("doc site dynamic JSR version resolution + rebuild &
redeploy") plus the scaffold zero-drift requirement.

## Findings (all verified against live GitHub state this session)

### F1 — Docs already read the version from the manifest (no work)
`main:docs/site/_data.ts:14-20`:
```ts
import cliPackageJson from "../../packages/cli/deno.json" with { type: "json" };
export const releaseVersion: string = cliPackageJson.version;
export const releaseSpecifier: string = `@${releaseVersion}`;
```
Built by PR #106 (decision D4, commit `e03aefef`). When `main` bumps to `0.0.1-alpha.3`, a docs
build on `main` reads `alpha.3` automatically. **The "dynamic version" half of #112 is done.**

### F2 — Pages already builds from `main`, env already allows `main` (no work)
- `GET repos/rickylabs/netscript/pages` → `{ build_type: "workflow", source: { branch: "main", path: "/" } }`.
- `github-pages` environment deployment-branch policy already allow-lists `main` (alongside
  `docs/user-site`, `release/jsr-readiness`).
- `main:docs/site/deno.json` has full `build` / `check:links` / `check:caveats` / `verify` tasks.
- `compare main...docs/user-site` → **0** differing `docs/site/**` files; `main` is *ahead*
  (`bc72364a` 2026-06-25 vs `docs/user-site` `f8797a1c` 2026-06-22). So `main ⊇ docs/user-site` for
  docs content. `docs/user-site` is the stale preview branch; retiring it as the deploy source loses
  nothing.

### F3 — The ONLY missing piece: `pages.yml` is not on `main` (the gap that "never landed")
- `pages.yml` exists **only on `docs/user-site`** and triggers **only** on `push` to that branch.
- `release:` events fire workflows from the **default branch (`main`)** only — so no docs rebuild
  happens on a release today.
- No harness run ever designed a release-triggered docs redeploy. Searched
  `chore-jsr-alpha1-publish-prep` (designed the dynamic version, not the action),
  `fix-jsr-publish-mechanism--publish-release-links`, the docs-v4 run, `arch-debt.md`, `.agents/` —
  no match. **Net-new.**
- Precedent to mirror: `main:.github/workflows/e2e-cli-prod.yml` and `publish.yml` both already use
  `on: release: { types: [published] }` + `workflow_dispatch`.

### F4 — Scaffold runtime output is already zero-drift; only TEST FIXTURES hardcode the version
- `packages/cli/src/kernel/constants/jsr-specifiers.ts` derives
  `NETSCRIPT_RELEASE_VERSION = cliPackageJson.version` from `packages/cli/deno.json`. Every scaffold
  JSR pin flows from this single source via `JSR_SPECIFIERS` + `import-resolver.ts`. So
  `deno bump-version` → `cli/deno.json` → all scaffold output auto-updates. **Runtime: zero drift.**
- **But** these test files hardcode literal `@0.0.1-alpha.2` assertions and will go RED on the bump:
  - `src/public/adapters/jsr-import-resolver_test.ts` (lines 12,16,20,24,28,48,49)
  - `src/maintainer/features/sync/plugin/copy-official-plugin-copy_test.ts` (187,191,195,204,439,445,451,455)
  - `src/kernel/templates/service/generators_test.ts:38`
  - `src/kernel/adapters/plugin/scaffolder_test.ts:85`
  - `src/kernel/adapters/scaffold/tests/import-resolver_test.ts` (21,22)
  - `src/kernel/adapters/scaffold/import-resolver.ts:164` — doc-comment only (cosmetic).
- The legitimate version sources (`packages/cli/deno.json:3`, `packages/cli/e2e/deno.json:3`) are
  rewritten by `bump-version` and are NOT drift.

### F5 — Bump mechanism
`deno bump-version prerelease` (native, run from workspace root) increments the prerelease segment
`alpha.2 → alpha.3` across all 32 members + rewrites root import-map jsr: refs. Validated this
session (reverted, pending this PR landing). `0.0.1-alpha.2` is LIVE+immutable on JSR
(skip-already-published), so alpha.3 is required to ship the #127 CLI fix.

## Out of scope (recorded, not done here)
- Retiring `docs/user-site`'s own `pages.yml` push trigger (cleanup on the preview branch; optional
  follow-up — leaving it does no harm since the Pages source is `main`).
- The actual version bump + tag + release (separate step after this PR merges).
- #116 prod CLI demo + 4-tutorial e2e (after alpha.3 publishes).
