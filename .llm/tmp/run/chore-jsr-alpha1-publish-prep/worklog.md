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

## Adversarial review

- Reviewer role: WSL Codex adversarial pre-IMPL-EVAL reviewer for PR #116.
- Fix commit: `1a21808ff335a277cfd00f431045b83adb7fcf5b` — `fix(publish-prep): close alpha-1 version gaps`.
- Unrelated dirty files present before review and left untouched:
  `.llm/tmp/run/openhands/pr-17/run-27493382997-1/request.md`,
  `.llm/tmp/run/openhands/pr-25/run-27305429810-1/request.md`,
  `.llm/tmp/run/openhands/pr-32/run-27433712260-1/request.md`,
  `.llm/tmp/run/openhands/pr-35/run-27454103300-1/request.md`,
  `.llm/tmp/run/openhands/pr-35/run-27454169329-1/request.md`,
  `.llm/tmp/run/openhands/pr-37/run-27454273181-1/request.md`.

### Checks

- Version completeness:
  - Command: `jq -r '.version' deno.json && deno eval '<scan packages/* + plugins/* deno.json versions>'`
  - Raw result: exit 0; root version `0.0.1-alpha.1`; `bad=0` for direct `packages/*/deno.json` and `plugins/*/deno.json` manifests.
  - Defect found/fixed: root `deno.json` was still `0.0.1-alpha.0`; fixed in `1a21808f`.
- Single version source integrity:
  - Command: `sed -n '1,220p' packages/cli/src/kernel/constants/jsr-specifiers.ts && sed -n '1,180p' packages/cli/deno.json`
  - Raw result: exit 0; `NETSCRIPT_RELEASE_VERSION` imports `../../../deno.json` as JSON and `NETSCRIPT_RELEASE_TAG` is derived from that version; no runtime file read permission is introduced.
  - Command: `rg -n 'jsr:@netscript/.+@\^?1\.0\.0' packages/cli/src || true`
  - Raw result: exit 0 with no matches.
  - Defect found/fixed: `packages/cli/src/maintainer/features/release/eject/release-eject-constants.ts` still hardcoded `LOCKSTEP_VERSION = '0.0.1-alpha.0'` and writes producer-root member versions; fixed to consume `NETSCRIPT_RELEASE_VERSION` in `1a21808f`.
- Prisma adapter addition:
  - Command: `find packages plugins -mindepth 2 -maxdepth 2 -name deno.json ...` and `jq -r '.workspace[]?' deno.json`
  - Raw result: exit 0 for direct package/plugin manifest scan; `packages/prisma-adapter-mysql/deno.json` exists at `0.0.1-alpha.1`; root workspace includes `packages/*`.
  - Defect found/fixed: clean.
- CLI JSON import cleanup:
  - Command: `deno check --unstable-kv packages/cli/src/maintainer/features/release/eject/release-eject-constants.ts packages/cli/src/maintainer/features/release/eject/producer-root-files.ts`
  - Raw result: exit 0.
  - Command: `rtk proxy deno test --allow-all packages/cli/src/kernel/adapters/scaffold/tests/import-resolver_test.ts packages/cli/src/kernel/adapters/plugin/scaffolder_test.ts packages/cli/src/kernel/templates/service/generators_test.ts packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-copy_test.ts packages/cli/src/public/adapters/jsr-import-resolver_test.ts`
  - Raw result: exit 0; `11 passed (16 steps)`.
  - Defect found/fixed: clean.
- Docs version + voice:
  - Command: `rg -n '0\.0\.1-alpha\.0|\^1\.0\.0|not installable|forward-looking|honest|honesty|honestly' docs/site packages/config --glob '!docs/site/_plan/**'`
  - Raw result before fix: exit 0; stale `packages/config/tests/_fixtures/readme-examples_test.ts:50` plus intended `docs/site/why.vto:133` debt caveat.
  - Raw result after fix: exit 0; only `docs/site/why.vto:133` (`alpha-specifiers-forward-looking`) remains.
  - Defect found/fixed: config README fixture used installed plugin version `0.0.1-alpha.0`; fixed to `0.0.1-alpha.1` in `1a21808f`.
- Publish workflow correctness:
  - Command: `sed -n '1,220p' .github/workflows/publish.yml`
  - Raw result: exit 0; trigger is `on.push.tags: ["v*"]`; permissions are `id-token: write` and `contents: read`; `denoland/setup-deno@v2` pins `2.8.3`; `deno task publish:dry-run` runs before workspace-root `deno publish`; no `GITHUB_TOKEN` publish step.
  - Defect found/fixed: clean.
- Lock hygiene:
  - Command: `git diff origin/main -- deno.lock`
  - Raw result: exit 0 with no output.
  - Defect found/fixed: clean.
- Required gates:
  - Command: `rtk proxy deno task publish:dry-run`
  - Raw result: exit 0.
  - Command: `rtk proxy deno task check:scaffold-versions`
  - Raw result: exit 0; `E-12 OK`.
  - Command: `rtk proxy deno test --allow-all <five focused CLI test files>`
  - Raw result: exit 0; `11 passed (16 steps)`.
  - Command: `rtk proxy deno task build` from `docs/site`
  - Raw result: exit 0; `306 files generated`.
  - Command: `deno test --allow-all packages/config/tests/_fixtures/readme-examples_test.ts packages/config/tests/schema/plugins_test.ts`
  - Raw result: exit 0; `7 passed`.
- Casts:
  - Command: `rg -n ' as ' packages/cli/src/kernel/constants/jsr-specifiers.ts packages/cli/src/kernel/adapters/scaffold/import-resolver.ts packages/cli/src/public/adapters/jsr-import-resolver.ts packages/cli/src/maintainer/adapters/plugin-import-rewriter.ts packages/cli/src/maintainer/features/release/eject/release-eject-constants.ts`
  - Raw result: exit 0 with only existing accepted/local casts: two JSONC parser casts in `plugin-import-rewriter.ts`, `as const` in `jsr-specifiers.ts`, and import-alias text matches. No new casts were added.
- Diff hygiene:
  - Command: `git diff --check -- deno.json packages/cli/src/maintainer/features/release/eject/release-eject-constants.ts packages/config/tests/_fixtures/readme-examples_test.ts`
  - Raw result: exit 0.
  - Command: `git diff --check`
  - Raw result: exit 2 due only to pre-existing unrelated `.llm/tmp/run/openhands/.../request.md` whitespace/CRLF files listed above.
