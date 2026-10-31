**Verdict: FAIL_FIX**

The design matches the twice-reviewed plan and the #2461 scope. The shipped tools, the consumer metadata and the CLI carrier are unchanged, and the Dependabot config, the Aspire manifest rule and the workflow-gate controls are correct. Three small, contained defects remain: one CI-reliability risk, one report field that misstates results, and one gap in the default-census evidence. No rescope and no debt are needed. Fix the three items and send it back to this same session.

### Required fixes

**F1. One test may fail in CI depending on which shard it lands in.** The last test in `standalone-projects_test.ts` starts `deno run --cached-only --allow-read .llm/tools/deps/census.ts`. `census.ts` pulls in `workspace.ts`, which imports `jsr:@std/fs@^1.0.0/walk`, `jsr:@std/jsonc@^1.0.0/parse` and `jsr:@std/path@^1.0.0` directly. Nothing the test file itself imports pulls those modules in.
- In CI, each test shard restores the module cache saved by the type-check lane, which only checks `packages/` and `plugins/`, and can fall back to an older cache. So whether those modules are cached depends on which other test files share the shard.
- It passed locally only because the local cache already had them.
- **Fix:** add `import './census.ts';` and `import './prod-install.ts';` to the test (both `main` functions only run when executed directly) so the test's own load caches them. Alternatively, drop `--cached-only`; `--allow-read` alone already proves there is no subprocess or network access at runtime. Then confirm on the draft PR's CI run.

**F2. In project mode, the audit `advisoriesFound` field ignores `--level`.** In `selectedProjectReport`, `advisoriesFound` is `metadata.vulnerabilities.total > 0`, which counts every severity. `--fail-on-find` instead follows npm's exit code, which does respect the level. So `--level critical` with a single low advisory reports `advisoriesFound: true` but still exits 0 under `--fail-on-find`. The existing Deno wrapper defines `advisoriesFound` as "found at or above the level", so the two modes disagree.
- **Fix:** derive `advisoriesFound` from npm's exit code (or count only severities at or above the level). Keep the overall total as a separate field such as `totalAdvisories`. Add a test with a low advisory under `--level high`.

**F3. Nothing proves the default census includes the browser project.** In `reports/native-evidence.json`, the `census-default` entry has `summary: {}`. No test runs the default (no `--project`) census and checks the new fields. The code does add `standaloneProjects`, `standaloneCounts` and `standaloneCoverage`, but the acceptance claim "root census includes standalone inventory" currently has no evidence.
- **Fix:** add a check to the CLI test that runs `census.ts --json` with no selector and asserts:
  - `standaloneCounts.directDependencies === 5`
  - `standaloneCoverage[0].included === true`
  - the existing `counts` keys are still present

  Then put those values into the evidence summary.

### Non-blocking (fix if convenient)

- **Help text:** the router's `--help` replaces the original wrapper's help. `deno task deps:outdated --help` no longer documents `--latest`/`--pretty`. Pass `--help` through to the child, or list those flags.
- **`deps:why --pretty`:** in default mode it now prints JSON instead of the original summary. The default task doesn't pass `--pretty`, so default output is unchanged apart from the added coverage field.
- **`why` report field:** in project mode it inherits `scope: 'direct'` from the inventory even when the package is only a transitive dependency. Rename it (for example `inventoryScope`) to avoid confusion.
- **Job-level skip:** a job-level `if: false` on `fresh-ui-browser` would skip the whole job. That goes beyond the nine bypass types agreed in the plan, but one more control would close it.
- **`drift.md` is stale:** it still says "No implementation drift yet". Record the root task-string edits, the npm 11 run via `npm-cli.js`, and the switch to `locked-stable` after the false-clean `npm outdated` finding.

### What the source and evidence show

| Area | Assessment |
|---|---|
| Shipped consumer tools (plan item R1) | `outdated.ts`, `why.ts`, `consumer-tools.json` and `consumer-README.md` contain no project or selector changes. Byte-identity and the carrier hash are recorded, and the assets-barrel, publish and preflight checks passed. Root `deno.json` changed only the `deps:outdated` and `deps:why` commands. The router starts the child with the original `--allow-read --allow-run` and passes its exit code through (test checks child exit 17 is returned as-is). |
| Selector and usage errors | `projectSelection` removes `--project`/`--project=` before reading the package name, and rejects duplicate, missing and unknown values. Production install, an invalid level, and `why` without a package exit 2 before anything runs (tested with a runner that throws if called). |
| Census | Reads only the manifest and v3 lock. Catches mismatches between declared and locked versions and between manifest and lock declarations (exit 3). Stays read-only and keeps the existing fields. |
| Freshness | `latest` and `outdated` use `locked-stable` through the exported `fetchLatestStable`/`basePinnedVersion`. There is no import cycle and no duplicate resolver. Lookup failures and prerelease "stable" versions give exit 3 with `clean: false` and no `behind` count (tested). Scope is `direct`. `npm outdated` is never called. |
| Provenance and audit | `npm ls … --all --package-lock-only --json`. Exit 1 with no graph means "absent"; an `error` or `problems` entry means an operational failure. Audit uses `--package-lock-only --include=dev`, requires report version 2, at least one dev package, and coverage of at least the inventory size; it covered 7 packages live. Source-pruning claims are explicitly unsupported. |
| Live evidence | npm 12.1.0 and 11.21.1 with no `node_modules`: `ls` and `audit` both exit 0. The deliberately old fixture showed `npm outdated` returning `{}` on both versions. Every selected wrapper produced the expected exit code, and production install exits 2. |
| Dependabot | Exact directory `/tools/fresh-ui-browser`, weekly, `increase`, `labels: []`, and the Playwright and axe pairs grouped. The test ties the directory to the shared project constant, checks both files exist, and rejects a wrong directory and a split pair. |
| Aspire manifest | An exact-path rule sits ahead of the general workflow rule, keeping class `ci:workflow` and owner `S1` with the specific rationale. Fixture is fresh (1024 rows, 0 unmatched) and parity passes. No exemption. |
| Workflow gate | Every earlier assertion is kept, and `fresh-ui-browser-contract` is added to the gate list. The new check pins the browser job's steps and requires the exact `run` command, which catches shell bypasses and path changes. It also checks the catalog entry for that gate, the `env.RUN` condition, no step- or job-level `continue-on-error`, the order (after install, before the browser run), and that the upload covers the receipt folder. All 16 in-memory negative controls cover the nine agreed bypass types. The old test was shown to accept the gate's removal. |
| No version or lock changes | Hashes for the browser manifest/lock, `deno.lock` and `packages/fresh-ui/deno.lock` are unchanged. The new import of `jsr:@std/semver@^1` is already locked. |
| Docs | The internal command docs (`.llm/tools/README.md`, `entry.md`, the deno-toolchain skill) and the browser README are updated. None of them are embedded in a carrier. |
| Full scaffold runtime | Ran and exited 1 at the Aspire doctor/Docker preflight; recorded as UNPROVEN. That's acceptable for a change that only touches repository tooling. Make sure the PR body doesn't claim a runtime PASS. |
