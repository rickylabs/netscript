# Worklog — JSR alpha-1 publish mechanics

Run-id: `chore-jsr-alpha1-publish-prep`
Branch: `chore/jsr-alpha1-publish-prep`
PR: #116

## Design

### Public Surface

- Workspace member `deno.json` versions are aligned for publish.
- CLI scaffold JSR import resolution emits exact alpha-1 `@netscript/*` pins.
- Docs site data exposes the current release version for examples and release framing.
- GitHub Actions publishes on release tag pushes through Deno OIDC.

### Domain Vocabulary

- `NETSCRIPT_RELEASE_VERSION` — the release train version derived from `packages/cli/deno.json`.
- `NETSCRIPT_RELEASE_TAG` — exact JSR suffix for the release version, e.g. `@0.0.1-alpha.1`.
- `JSR_SPECIFIERS` — canonical package-name to exact JSR specifier map.

### Ports

- Deno `bump-version` and `publish` are the release tools.
- GitHub Actions OIDC is the publish identity provider.
- Lume `_data.ts` is the docs data surface.

### Constants

- Target version: `0.0.1-alpha.1`.
- Publish tag pattern: `v*`.

### Commit Slices

1. Version align — normalize fresh-ui and run workspace prerelease bump; gate with scoped package check.
2. Single version source + exact scaffold pins — route all CLI JSR pins through one release-version source; gate scaffold version check and focused CLI tests.
3. Docs dynamic version + framing removal — route docs examples through release data and update debt target; gate scoped docs fmt/build where available.
4. OIDC publish workflow + lock regen — add tag-push publish workflow and regenerate lock from version churn only; gate publish dry-run.

### Deferred Scope

- README/package docs overhaul remains PR2.
- Actual release tag and publish execution happen after PR1/PR2/PR3 merge readiness.
- Slow-type cleanup remains accepted post-launch debt.

### Contributor Path

- Update release mechanics by changing the CLI package version, then consume `NETSCRIPT_RELEASE_VERSION` rather than literal `@netscript/*` version strings.

## Slice 1 — Version Align

- Commit: `6c66850c` — `chore(publish-prep): align all members to 0.0.1-alpha.1`
- Files: 32 member `deno.json` files under `packages/` and `plugins/`.
- Verification:
  - `deno task version:bump prerelease -w` — exit 0; 32 package(s) bumped.
  - `grep -rn 'jsr:@netscript' packages/*/deno.json plugins/*/deno.json | grep -v '0.0.1-alpha.1'` — exit 1, no stale member refs.
  - `rg --pcre2 -n '"version": "(?!0\.0\.1-alpha\.1")' packages plugins --glob deno.json` — exit 1, no off-version member manifests.
  - `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages --ext ts,tsx` — exit 0, `failedBatches: 0`.

## Slice 2 — Single Version Source + Exact Scaffold Pins

- Commit: `159e035d` — `fix(cli): single-source JSR pins at exact alpha-1 version`
- Files:
  - `packages/cli/src/kernel/constants/jsr-specifiers.ts`
  - `packages/cli/src/kernel/adapters/scaffold/import-resolver.ts`
  - `packages/cli/src/public/adapters/jsr-import-resolver.ts`
  - `packages/cli/src/maintainer/adapters/plugin-import-rewriter.ts`
  - five focused CLI test files named in PLAN-EVAL
  - `packages/cli/deno.json` strict-JSON cleanup so the version manifest can be imported without a runtime read.
- Verification:
  - `deno task check:scaffold-versions` — exit 0, `E-12 OK`.
  - `deno test --allow-all <five focused CLI test files>` — exit 0, `11 passed (16 steps)`.
  - `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/src --ext ts,tsx` — exit 0, `failedBatches: 0`.
  - `rg -n 'jsr:@netscript/.+@\^1\.0\.0' packages/cli/src` — exit 1, no stale NetScript stable-range pins.
  - New casts: none.
  - `deno fmt --check` with root and CLI configs reported `No target files found` because CLI is excluded from those fmt targets; no mutating formatter was run.

## Slice 3 — Docs Dynamic Version + Framing Removal

- Commit: `e03aefef` — `docs(site): single-source release version, drop stale 1.0.0 framing`
- Files:
  - `docs/site/_data.ts`
  - docs-site pages and callouts named by PLAN-EVAL, plus adjacent docs-site pages found by stale-version scan
  - `packages/config` docs/JSDoc/schema tests with adjacent alpha-0 examples
  - `.llm/harness/debt/arch-debt.md`
- Verification:
  - `rg -n '0\.0\.1-alpha\.0|\^1\.0\.0|not installable today|not published yet|not installable at' ...` — exit 1, no stale docs/config matches.
  - `rg -n 'forward-looking' ...` — only the open debt marker comment remains.
  - `rg -n 'plugin-workers\.0\.1-alpha\.1|config\.0\.1-alpha\.1|plugin-auth-core\.0\.1-alpha\.1' docs/site packages/config` — exit 1, no malformed specifier remnants.
  - `git diff --check -- docs/site packages/config/... .llm/harness/debt/arch-debt.md` — exit 0.
  - `deno test --allow-all packages/config/tests/schema/plugins_test.ts` — exit 0, `3 passed`.
  - `deno task build` from `docs/site` — exit 0, `306 files generated`.
  - `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root docs/site --ext ts,tsx,vto,md` — exit 1 on 158 existing docs-site formatting findings, including `_plan` and generated reference docs; recorded as drift.

## Slice 4 — OIDC Publish Workflow + Lock Regen

- Commit: `801dfdaa` — `ci(publish): OIDC tag-push deno publish workflow + lock regen`
- Files:
  - `.github/workflows/publish.yml`
- Workflow behavior:
  - Runs on `push` tags matching `v*`.
  - Grants `id-token: write` and `contents: read`.
  - Uses `actions/checkout@v4`, `denoland/setup-deno@v2` pinned to `2.8.3`, `deno task publish:dry-run`, then `deno publish`.
- Verification:
  - `deno task publish:dry-run` — exit 0 across the workspace at `0.0.1-alpha.1`.
  - Publish dry-run warnings observed were existing slow-type and dynamic-import warnings; the command completed successfully.
  - `deno.lock` was restored from earlier docs-build noise before the gate. After the successful publish dry-run, `git diff --name-only -- deno.lock` produced no output, so there was no version-driven lockfile change to commit.
