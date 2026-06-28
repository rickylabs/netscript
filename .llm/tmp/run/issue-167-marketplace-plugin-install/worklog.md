# Worklog — issue-167-marketplace-plugin-install

## Design

### Public Surface

- `@netscript/plugin/protocol` is the neutral protocol home for S1. It exports:
  - `PluginInstallerManifestSchema`
  - `parsePluginManifest(json): PluginManifestParseResult`
  - `PLUGIN_MANIFEST_SCHEMA_VERSION`
  - manifest protocol types for installer consumers
  - `ScaffolderContext`, `ScaffoldResult`, and `PluginScaffoldEntrypoint`
- `@netscript/plugin` root re-exports the same protocol symbols for existing plugin-authoring users.
- The five shipped `plugins/*/scaffold.plugin.json` manifests remain JSON manifests and now include
  the versioned installer contract fields.

### Domain Vocabulary

- Manifest contract: `PluginInstallerManifest`, `PluginManifestCapabilities`,
  `PluginManifestScaffolder`, `PluginScaffolderRequiredPermissions`.
- Static parse result: `PluginManifestParseResult`, `PluginManifestParseError`,
  `PluginManifestParseIssue`.
- Scaffolder protocol: `ScaffolderContext`, `ScaffoldResult`, `PluginScaffoldEntrypoint`.
- Compatibility blocks retained: `provider`, `officialSource`.

### Ports

- No new runtime port was introduced in S1. Static validation is pure and does not execute plugin code.

### Constants

- `PLUGIN_MANIFEST_SCHEMA_VERSION = 1`.
- `scaffolder.export = "./scaffold"` is declared in first-party manifests for later S4/S6-S10
  implementation.

### Commit Slices

- S1: promote the plugin manifest protocol and scaffolder types in `@netscript/plugin`, migrate the
  five shipped manifests, and prove validation with package tests + JSR gates.

### Deferred Scope

- No CLI resolver, JSR fetcher, permission runner, dx scaffolder implementation, or true-userland E2E
  was implemented. Those remain S2+.
- The declared `./scaffold` export is protocol metadata only in S1; later slices add the executable
  exports.

### Contributor Path

- New installer consumers should import static validation from `@netscript/plugin/protocol`.
- New plugin scaffolders should implement `PluginScaffoldEntrypoint` and return `ScaffoldResult`.
- New manifest fields should be added in `packages/plugin/src/protocol/manifest.ts`, exported from
  `packages/plugin/src/protocol/mod.ts`, and covered by `packages/plugin/tests/protocol`.

## S1 Evidence — Plugin Protocol Contract

### Files

| Path | Purpose |
| ---- | ------- |
| `packages/plugin/src/protocol/manifest.ts` | Versioned Zod schema, static parser, manifest protocol types. |
| `packages/plugin/src/protocol/scaffolder.ts` | Scaffolder context/result/entrypoint protocol types. |
| `packages/plugin/src/protocol/mod.ts` | Published `@netscript/plugin/protocol` entrypoint. |
| `packages/plugin/mod.ts` | Root re-export of protocol contract. |
| `packages/plugin/deno.json` | Adds `./protocol` export and includes it in package check. |
| `packages/plugin/tests/protocol/plugin-manifest_test.ts` | Valid, malformed, schema mismatch, and shipped-manifest parser tests. |
| `plugins/{auth,sagas,streams,triggers,workers}/scaffold.plugin.json` | Migrated shipped manifests to schemaVersion 1 protocol fields. |

### Protocol Home Decision

Decision: put the S1 protocol in existing `@netscript/plugin`, exported as
`@netscript/plugin/protocol`, and also re-export from the root.

Rationale:

- `packages/shared` does not exist on this branch, so there is no clean shared package candidate.
- All five first-party plugin packages already depend on `@netscript/plugin`.
- `packages/cli` already imports `@netscript/plugin`.
- `@netscript/plugin` is the published plugin-authoring contract package, so the plugins do not gain a
  dependency on `@netscript/cli`.
- This stays within D3: it does not create a standalone `@netscript/plugin-protocol` package.

### Fitness Gates Touched

| Gate | S1 evidence |
| ---- | ----------- |
| F-3 | Protocol files live under `packages/plugin/src/protocol`; no CLI imports or forbidden layer direction introduced. |
| F-5 | Public protocol surface documented and `deno doc --lint` passed for `mod.ts` + `src/protocol/mod.ts`. |
| F-6 | `deno publish --dry-run --allow-dirty` passed without slow-type failure for `@netscript/plugin`. |
| F-7 | Public exports include JSDoc; doc lint passed for the changed export map. |
| F-8 | No workspace `compilerOptions.lib` override changed. |
| F-9 | Scaffolder manifest captures static `{net,read,write}` required permissions. |
| F-10 | Added protocol unit tests; package test passed. |
| F-11 | No generic forbidden folder introduced. |
| F-12 | New public types use doctrine naming conventions. |
| F-15 | No upstream package re-export introduced. |
| F-16 | New `src/protocol` folder has 3 files. |
| F-18 | `src/protocol/mod.ts` is a declared subpath export target. |
| F-CLI-4 | CLI remains a consumer; the protocol package does not import CLI surfaces. |
| F-CLI-9 | Publish dry-run passed for the changed public package surface. |
| F-CLI-10 | Package `publish:dry-run` task passed. |

### Gate Results

| Gate | Command | Result |
| ---- | ------- | ------ |
| Check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin --ext ts,tsx` | PASS; wrapper ran `deno check --quiet --unstable-kv <files>`, 109 files, 0 occurrences. |
| Lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin --ext ts,tsx` | PASS; 109 files, 0 occurrences. |
| Format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin --ext ts,tsx --ignore-line-endings` | PASS; 109 files, 0 findings. |
| Test | `deno task test` from `packages/plugin` | PASS; 25 tests passed, 0 failed. |
| Doc lint | `deno doc --lint mod.ts src/protocol/mod.ts` from `packages/plugin` | PASS; checked 2 files. |
| Publish task | `deno task publish:dry-run` from `packages/plugin` | PASS; existing package task uses `--allow-slow-types` and reports existing dynamic-import warning in `src/sdk/discovery/manifest-resolver.ts`. |
| Publish no-slow check | `deno publish --dry-run --allow-dirty` from `packages/plugin` | PASS; no slow-type failure, existing dynamic-import warning remains. |

### Notes

- Initial wrapper attempt used `--unstable-kv` directly and failed because the wrapper adds it by
  default; rerun without that unsupported wrapper argument passed.
- `deno.lock` was not touched.

## S2 Evidence — CLI Resolver + Static JSR Validator

Timestamp: 2026-06-28T08:51:08Z

### Scope

- Added a `plugin add <spec>` package resolver under
  `packages/cli/src/public/features/plugins/add/`.
- Added the static JSR validator port under the add feature and the fetch-backed adapter under
  `packages/cli/src/public/infra/jsr/`.
- Wired `plugin add` to resolve and validate package specs before planning when a validator is
  available, while preserving the existing legacy `api` kind path.
- Added unit tests with fixture HTTP responses only; no test hits `jsr.io`.

### Alias-Order Decision

Decision: resolve the bare-kind alias map before any `PluginKindRegistry.get` path can throw.

Implementation detail:

- `resolvePluginDescriptorBeforePlanning()` checks `BARE_PLUGIN_PACKAGE_ALIASES` first.
- For `workers`, the resolver maps to `@netscript/plugin-workers`, the validator parses
  `scaffold.plugin.json` with `parsePluginManifest`, the manifest provider seeds
  `PluginKindRegistry`, and planning continues with provider kind `worker`.
- This implements PLAN-EVAL note 3 via "resolve alias first", not registry pre-seeding.

### Files

| Path | Purpose |
| ---- | ------- |
| `packages/cli/src/public/features/plugins/add/plugin-package-resolver.ts` | Bare alias, scoped package, and explicit `jsr:` resolver. |
| `packages/cli/src/public/features/plugins/add/jsr-plugin-validator-port.ts` | Injectable static validation port and descriptor/result types. |
| `packages/cli/src/public/infra/jsr/fetch-jsr-plugin-validator.ts` | Fetch adapter for `meta.json`, `<version>_meta.json`, `api.jsr.io`, and `scaffold.plugin.json`. |
| `packages/cli/src/public/features/plugins/add/add-plugin.ts` | Alias-before-registry validation and manifest-provider registry seeding. |
| `packages/cli/src/public/features/root/public-command-dependencies.ts` | Public CLI composition injects the fetch-backed validator. |
| `packages/cli/src/public/domain/plugin-add-plan.ts` | `AddPluginResult` carries the resolved static descriptor for later S3/S4 reuse. |
| `packages/cli/src/public/features/plugins/add/*_test.ts`, `packages/cli/src/public/infra/jsr/*_test.ts` | Resolver, validator fixture, and alias-order regression tests. |

### Publish Config Prerequisite

The validator classifies plugins only by fetching published `scaffold.plugin.json` and running
`parsePluginManifest`; it never downloads or executes plugin code. S6-S10 must ensure each plugin's
JSR publish include list ships `scaffold.plugin.json`. If a package omits it, S2 correctly reports
`manifest-missing`.

### Fitness Gates Touched

| Gate | S2 evidence |
| ---- | ----------- |
| F-3 | Feature owns the port; fetch implementation stays in public infra; no kernel import from public/maintainer surfaces. |
| F-5 | No package export-map change; new descriptor types are internally reachable from the public add flow. |
| F-6 | No `deno.json` export/publish surface changed; `publish:dry-run` not required for S2. |
| F-8 | No compiler lib override changed. |
| F-9 | Validator preserves manifest scaffolder permission metadata for S3. |
| F-10 | Added resolver/validator unit tests and alias-order regression. |
| F-11 | No generic `utils`/`helpers` folder introduced. |
| F-12 | New types use doctrine naming conventions. |
| F-15 | No upstream package re-export introduced. |
| F-16 | New add-feature and infra/jsr folders remain below cardinality limits. |
| F-18 | No new subdirectory barrel introduced. |
| F-CLI-3 | Public feature code does not import maintainer/local surfaces for the new resolver/validator path. |
| F-CLI-4 | Kernel remains independent of public resolver/validator code. |
| F-CLI-11 | New public resolver contains only JSR package identity, not monorepo local-source terms. |
| F-CLI-16 | Network effect is confined to `src/public/infra/jsr/fetch-jsr-plugin-validator.ts`. |
| F-CLI-21 | New files follow feature/use-case and infra naming. |
| F-CLI-28 | Fetch dependency is injected through `JsrHttpClient`; tests use fixtures. |

### Gate Results

| Gate | Command | Result |
| ---- | ------- | ------ |
| Check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS; 532 files, 0 occurrences. |
| Unit tests | `deno test --allow-all packages/cli/src/public/features/plugins/add/plugin-package-resolver_test.ts packages/cli/src/public/infra/jsr/fetch-jsr-plugin-validator_test.ts packages/cli/src/public/features/plugins/add/add-plugin_test.ts` | PASS; 3 test modules, 15 steps, 0 failed. |
| Package test | `rtk proxy deno task test` from `packages/cli` | FAIL (pre-existing unrelated): 3 `project-config-loader_test.ts` cases resolve child path as `packages/cli/packages/cli/src/kernel/adapters/config/project-config-loader-child.ts` when the task is run from `packages/cli`. New S2 tests passed in the same run. |
| Lint wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --cwd packages/cli --file <S2 files> --ext ts,tsx` | BLOCKED by repo config exclusion behavior; wrapper selected 9 files but `deno lint` returned exit 1 with no lint occurrences because CLI files are excluded by discovered config. |
| Lint fallback | `deno lint --no-config <S2 files>` from `packages/cli` | PASS; checked 9 files. |
| Format wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --cwd packages/cli --file <S2 files> --ext ts,tsx` | BLOCKED by repo config exclusion behavior; wrapper selected 9 files but `deno fmt --check` returned exit 1 with no findings. |
| Format fallback | `deno fmt --check --no-config --line-width 100 --indent-width 2 --single-quote --no-semicolons=false <S2 files>` from `packages/cli` | PASS; checked 9 files. |
| Raw package lint | `deno lint .` from `packages/cli` | PASS; checked 75 files. |
| Raw package fmt | `deno fmt --check .` from `packages/cli` | FAIL (pre-existing unrelated): `packages/cli/e2e/README.md` line wrapping drift. |
| Publish dry-run | Not run | Not required: S2 did not change `packages/cli/deno.json` exports or the published root `mod.ts` surface. |

### Notes

- `deno.lock` was not touched.
- No new TypeScript casts were introduced.
- Static classification uses `parsePluginManifest` from `@netscript/plugin/protocol`; manifest
  parsing was not reimplemented in the CLI.

## S3 Evidence — Confirmation Gate + Confined Permission Flags

Timestamp: 2026-06-28T11:23:42Z

### Scope

- Added `classifyPluginTrust()` under `packages/cli/src/public/features/plugins/add/`.
- Added injectable `confirmPluginInstall()` under the same add feature. It consumes S2's
  `ValidatedPluginDescriptor`, renders JSR metadata from `details`, prompts through `PromptPort`,
  and never calls `prompt()` directly.
- Added `buildPluginScaffoldPermissionFlags()` under `packages/cli/src/public/infra/permissions/`.
- Lightly wired `plugin add` to pass `--skip-confirmation` / `--ci` and to run the confirmation gate
  after S2 validation but before the existing render path. S4 still owns dx scaffolder execution.

### Trust And Permission Matrix

| Tier | Classifier | Confirmation | Deno x flags |
| ---- | ---------- | ------------ | ------------ |
| First-party trusted | `descriptor.package.scope.toLowerCase() === "netscript"` | Skipped as first-party | `-A`; optional first-party-only `--minimum-dependency-age=0` when explicitly requested by the future runner. |
| Third-party confined | Any non-`@netscript` scope | Required unless `--skip-confirmation` or `--ci` | `--allow-read=<projectRoot>`, one scoped `--allow-write=<projectRoot>/plugins/<pluginName>,<projectRoot>/services,<projectRoot>/database,<projectRoot>/aspire,<projectRoot>/.aspire`, `--deny-net`, `--deny-run`. |

Third-party packages keep Deno's default `--minimum-dependency-age`; S3 does not inject
`--minimum-dependency-age=0` for third-party even when the future runner opts into fresh first-party
alpha installs.

### Files

| Path | Purpose |
| ---- | ------- |
| `packages/cli/src/public/features/plugins/add/plugin-trust-tier.ts` | Pure descriptor-scope trust classifier. |
| `packages/cli/src/public/features/plugins/add/confirm-plugin-install.ts` | Feature-level confirmation gate using `PromptPort`. |
| `packages/cli/src/public/infra/permissions/plugin-scaffold-permissions.ts` | Infra-level Deno flag builder for S4's runner. |
| `packages/cli/src/public/features/plugins/add/add-plugin-command.ts` | Adds `--skip-confirmation` and `--ci` options. |
| `packages/cli/src/public/features/plugins/add/add-plugin.ts` | Runs the confirmation gate before existing rendering when S2 returned a descriptor. |
| `*_test.ts` beside the new units | Trust, confirmation, and exact flag-string assertions. |

### Fitness Gates Touched

| Gate | S3 evidence |
| ---- | ----------- |
| F-3 | Confirmation stays in the add feature; Deno flag construction stays in public infra; no kernel import from public code was introduced. |
| F-5 | No `packages/cli/deno.json` export-map change; no new root `@netscript/cli` public export. |
| F-6 | Publish dry-run not required because the package export map and root public surface did not change. |
| F-8 | No compiler lib override changed. |
| F-9 | Third-party scaffold execution uses explicit read/write/deny flag policy; plugin-declared permissions do not widen the confined matrix. |
| F-10 | Added unit tests for trust classification, confirmation bypass/prompting, and exact flag strings. |
| F-11 | No forbidden generic folder introduced; `infra/permissions` names the external permission concern. |
| F-12 | New public-layer types use doctrine naming conventions. |
| F-15 | No upstream package re-export introduced. |
| F-16 | New feature and infra folders remain below cardinality limits. |
| F-18 | No new subdirectory barrel introduced. |
| F-CLI-3 | Feature-level confirmation does not import infra; the infra flag builder imports only descriptor type/classifier and constants. |
| F-CLI-4 | Kernel remains independent of the public add feature and permission builder. |
| F-CLI-11 | Trust classification is derived from resolved package scope, not local checkout state. |
| F-CLI-16 | No new network or process effect; prompt is injected, and permission flags are pure strings. |
| F-CLI-21 | New files follow vertical feature naming and infra concern naming. |
| F-CLI-28 | Confirmation prompt is injectable; tests use fake prompt ports. |

### Gate Results

| Gate | Command | Result |
| ---- | ------- | ------ |
| Check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS; 538 files, 0 occurrences. |
| S3 unit tests | `deno test -A --unstable-kv packages/cli/src/public/features/plugins/add/plugin-trust-tier_test.ts packages/cli/src/public/features/plugins/add/confirm-plugin-install_test.ts packages/cli/src/public/infra/permissions/plugin-scaffold-permissions_test.ts` | PASS; 3 modules, 11 steps, 0 failed. |
| Add/resolver regression tests | `deno test -A --unstable-kv packages/cli/src/public/features/plugins/add/add-plugin_test.ts packages/cli/src/public/features/plugins/add/plugin-package-resolver_test.ts packages/cli/src/public/infra/jsr/fetch-jsr-plugin-validator_test.ts packages/cli/src/public/features/plugins/add/plugin-trust-tier_test.ts packages/cli/src/public/features/plugins/add/confirm-plugin-install_test.ts packages/cli/src/public/infra/permissions/plugin-scaffold-permissions_test.ts` | PASS; 6 modules, 26 steps, 0 failed. |
| Lint wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --cwd packages/cli --file <S3 files> --ext ts,tsx` | BLOCKED by existing CLI exclusion behavior; wrapper selected 11 files but `deno lint` exited 1 with 0 occurrences because Deno still applied the workspace config exclusion for `packages/cli`. |
| Lint fallback | `deno lint --config /dev/null --rules-exclude=no-import-prefix,no-explicit-any <S3 files>` from `packages/cli` | PASS; checked 11 files. The exclusions match existing CLI test inline `jsr:` imports and Cliffy `Command<any,...>` return types. |
| Format wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --cwd packages/cli --file <S3 files> --ext ts,tsx` | BLOCKED by existing CLI exclusion behavior; wrapper selected 11 files but `deno fmt --check` exited 1 with 0 findings. |
| Format fallback | `deno fmt --no-config --single-quote --line-width 100 --check <S3 files>` from `packages/cli` | PASS; checked 11 files. |
| Publish dry-run | Not run | Not required: S3 did not change `packages/cli/deno.json` exports or the published root `mod.ts` surface. |

### Notes

- Commit: `bde482fd` (`feat(cli): add plugin install confirmation gate`).
- `deno.lock` was not touched.
- No new TypeScript casts were introduced.
- S4 seam: `buildPluginScaffoldPermissionFlags()` returns the exact `deno x` flags the future
  scaffold runner should prepend before the resolved scaffolder specifier.

## S4 Evidence — Scaffold Runner + Integrity + Post-Scripts + Dry-Run + Source Modes

Timestamp: 2026-06-28T13:18:00Z

### Scope

- Added `dispatchPluginScaffold()` beside the existing plugin verb dispatcher. It runs a
  plugin-owned `./scaffold` entrypoint with S3 permission flags, sends a JSON
  `ScaffolderContext` payload via `--context-json`, parses the child `ScaffoldResult` from stdout,
  and runs declared post-scripts only after a non-dry successful scaffold.
- Added JSR package integrity verification against S2 `_meta.json` per-file `sha256-*` checksums
  before any JSR source scaffolder executes.
- Added source-mode request/command fields for `--jsr-url`, `--local-path`, and `--dry-run` on the
  public plugin add command and the local contributor command.
- Added local manifest resolution for `--local-path` using `parsePluginManifest`; local-path sources
  are maintainer-selected disk code, so JSR checksum integrity does not apply.
- Added a deterministic local fixture under `packages/cli/tests/fixtures/plugin-scaffolder/` that
  exposes `scaffold.plugin.json`, `scaffold.ts`, and a post-script.
- Kept the legacy checkout/copy/render path in place. S4 adds the plugin-owned runner path and
  dry-run preview; S5 still owns retiring the copier from the userland default.

### PLAN-EVAL Note 1 — Dispatch Shape

Decision: implement `scaffold` as a sibling function, `dispatchPluginScaffold()`, in the existing
`dispatch/dispatch-plugin-verb.ts` module rather than adding `scaffold` to the existing
`FrameworkVerb` discriminated union.

Rationale: the current union represents framework-owned operational verbs dispatched to
`deno x -A jsr:<pkg>/cli <verb>`. The S4 scaffold runner has a different target (`./scaffold`),
permission source (S3 confined flags), integrity preflight, context/result JSON contract, dry-run
semantics, and post-script phase. A sibling keeps existing `/cli` verb dispatch stable while keeping
plugin subprocess control centralized in the same dispatch module.

### PLAN-EVAL Note 5 — `--local-path` Invocation Shape

Public mode defaults to JSR resolution from the positional plugin spec or `--jsr-url <specifier>`;
`--local-path <dir>` overrides that and reads `<dir>/scaffold.plugin.json`.

Local contributor mode defaults to `--local-path <sourceRootStartDir>/plugins/<kind>` unless
`--jsr-url` is supplied; an explicit `--local-path <dir>` overrides the default.

Execution shape:

- JSR source: `deno x <S3-confined-flags> jsr:@scope/pkg/scaffold --context-json <json>`.
- Local source: `deno run <S3-confined-flags> <local-path>/scaffold.ts --context-json <json>`.

Reason for the local `deno run` shape: Deno 2.9 rejects `deno x <local-file>` with
`Use 'deno run' to run a local file directly, 'deno x' is intended for running commands from packages.`
The local-path fixture uses the executable-equivalent `deno run` form so S11 can validate maintainer
scaffolders without relying on unsupported Deno behavior.

### Files

| Path | Purpose |
| ---- | ------- |
| `packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts` | Adds scaffold dispatch, source target resolution, context JSON, result parsing, dry-run post-script skip. |
| `packages/cli/src/public/infra/jsr/verify-jsr-package-integrity.ts` | Fetches published package files and checks sha256 against S2 version metadata. |
| `packages/cli/src/public/features/plugins/add/add-plugin.ts` | Resolves JSR/local descriptors, invokes the plugin-owned runner when available, returns dry-run preview without legacy writes. |
| `packages/cli/src/public/features/plugins/add/add-plugin-command.ts` | Adds `--dry-run`, `--jsr-url`, and `--local-path` to public plugin add. |
| `packages/cli/src/local/features/plugins/add/add-local-plugin-command.ts` | Adds symmetric flags and local contributor default local-path source. |
| `packages/cli/src/public/domain/plugin-add-plan.ts` / `add-plugin-input.ts` | Carries source-mode and dry-run request/result fields. |
| `packages/plugin/src/protocol/manifest.ts` / `mod.ts` | Adds optional `postScripts` manifest protocol field. |
| `packages/cli/tests/fixtures/plugin-scaffolder/*` | Local deterministic fixture scaffolder and post-script. |
| `*_test.ts` beside add/dispatch | Runner, dry-run, integrity, post-script, argv, and add-flow fixture tests. |

### Fitness Gates Touched

| Gate | S4 evidence |
| ---- | ----------- |
| F-3 | Scaffold orchestration lives in public feature/dispatch; JSR file fetching is public infra; protocol stays in `@netscript/plugin`. |
| F-5 | `@netscript/plugin/protocol` public type surface adds documented `PluginManifestPostScript`; `deno doc --lint` passed. |
| F-6 | `@netscript/plugin` and `@netscript/cli` publish dry-runs passed. |
| F-8 | No compiler lib override changed. |
| F-9 | Runner consumes S3 flags; third-party argv test asserts confined flags are passed to `deno x`. |
| F-10 | Added local fixture runner, dry-run no-write, integrity pass/fail, post-script, and add-flow preview tests. |
| F-11 | New folders are named by role (`infra/jsr`, `tests/fixtures/plugin-scaffolder`); no generic helpers folder introduced. |
| F-12 | New types use doctrine naming conventions (`PluginScaffoldDispatchSource`, `JsrPackageFileFetcher`). |
| F-15 | No upstream package re-export introduced. |
| F-16 | Existing add/dispatch files grew, but no new flat command-surface folder was introduced; S5 may split if the runner expands. |
| F-18 | No new subdirectory barrel introduced. |
| F-CLI-3 | Public add flow still owns user request orchestration; local contributor command only maps flags/defaults. |
| F-CLI-4 | Kernel remains independent of public resolver/runner/infra code. |
| F-CLI-11 | Source-mode selection is explicit (`jsr` vs `local-path`) and does not depend on monorepo checkout probing. |
| F-CLI-16 | Process and JSR file effects are injected behind `ProcessPort` / `JsrPackageFileFetcher`; tests use fixtures. |
| F-CLI-19 | `--dry-run` returns the plugin-owned preview and skips legacy writes and post-scripts. |
| F-CLI-21 | New files follow existing feature/use-case and infra naming. |
| F-CLI-28 | JSR integrity fetch is injectable; unit tests do not hit the real network. |

### Gate Results

| Gate | Command | Result |
| ---- | ------- | ------ |
| Check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --root packages/plugin --ext ts,tsx` | PASS; 650 files, 0 occurrences. |
| Required CLI tests | `deno test -A --unstable-kv packages/cli/...` | BLOCKED by Deno path handling: literal `packages/cli/...` resolves as a missing file URL. |
| Required CLI tests fallback | `deno test -A --unstable-kv packages/cli` from repo root | PASS; 173 tests, 349 steps, 0 failed. |
| Focused S4 tests | `deno test -A --unstable-kv packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb_test.ts packages/cli/src/public/features/plugins/add/add-plugin_test.ts` | PASS; local fixture scaffold/post-script, dry-run no-write, third-party argv, integrity pass/fail, and add-flow preview covered. |
| Lint wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --root packages/plugin --ext ts,tsx` | BLOCKED by existing CLI exclusion behavior; wrapper selected 650 files but exited 1 with 0 occurrences. |
| Format wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --root packages/plugin --ext ts,tsx` | BLOCKED by existing CLI exclusion behavior; wrapper selected 650 files but exited 1 with 0 findings. |
| Plugin lint wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin --ext ts,tsx` | PASS; 109 files, 0 occurrences. |
| Plugin fmt wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin --ext ts,tsx` | PASS; 109 files, 0 findings. |
| CLI lint fallback | `deno lint .` from `packages/cli` | PASS; checked 75 files. |
| CLI fmt fallback | `deno fmt --check --no-config --line-width 100 --indent-width 2 --single-quote --no-semicolons=false <S4 CLI files>` | PASS; checked 14 files. |
| Plugin tests | `deno test --allow-all` from `packages/plugin` | PASS; 25 tests, 0 failed. |
| Plugin doc lint | `deno doc --lint src/protocol/mod.ts mod.ts` from `packages/plugin` | PASS; checked 2 files. |
| Plugin publish dry-run | `deno task publish:dry-run` from `packages/plugin` | PASS; existing slow-types allowance and existing dynamic-import warning remain. |
| CLI publish dry-run | `deno task publish:dry-run` from `packages/cli` | PASS; existing dynamic-import warnings remain. |

### Notes

- `deno.lock` was not touched.
- No new TypeScript casts were introduced.
- No real JSR package code or network was executed in unit tests.
- Local-path integrity is intentionally not checked against JSR `_meta.json` checksums; local path is
  an explicit maintainer-selected source, and the manifest is parsed from disk before execution.

## S6 Evidence — `plugin-workers` DX `./scaffold` Entrypoint + Manifest

Timestamp: 2026-06-28T14:35:00Z

### Scope

- Added the workers plugin-owned scaffold entrypoint:
  - `plugins/workers/scaffold.ts` is the local-path executable wrapper S4 resolves from
    `scaffold.plugin.json` (`deno run <local-path>/scaffold.ts ...`).
  - `plugins/workers/src/scaffold/mod.ts` exports
    `scaffold(ctx: ScaffolderContext): Promise<ScaffoldResult>` and parses the S4
    `--context-json` argv contract when run as a CLI.
  - `plugins/workers/src/scaffold/artifacts.ts` owns the deterministic workers artifact list:
    plugin `deno.json`, manifest `mod.ts`, service/router, contracts, Prisma schema, background
    entrypoint, and sample job/task files.
  - `plugins/workers/src/scaffold/files.ts` writes only missing or changed files and returns
    workspace-relative `createdFiles` / `modifiedFiles`.
- Updated `plugins/workers/deno.json` to export `./scaffold`, check `scaffold.ts` and
  `src/scaffold/mod.ts`, and publish the root `scaffold.ts` wrapper.
- Added focused S6 coverage to
  `packages/cli/src/public/features/plugins/add/add-plugin_test.ts`:
  real `--local-path` workers add via the S4 runner, real workers dry-run no-write, and direct
  re-run idempotency through `dispatchPluginScaffold()`.
- Added a minimal `@module` tag to the existing public `./cli` export entrypoint so the full
  workers export map passes the JSR audit after adding `./scaffold`.

### PLAN-EVAL Note 4 — Self-Contained Import Graph

- Verified the new workers scaffolder does not import `@netscript/cli` or any `packages/cli` path.
- Command: `rtk rg -n " as |@netscript/cli|packages/cli" plugins/workers/scaffold.ts plugins/workers/src/scaffold plugins/workers/deno.json`
  returned no matches.
- The source import graph for the new scaffolder is limited to:
  - `@netscript/plugin/protocol` type import in `src/scaffold/mod.ts`.
  - `@std/path` in `src/scaffold/files.ts`.
  - Relative imports within `plugins/workers/src/scaffold/`.
- This keeps the `deno x jsr:@netscript/plugin-workers/scaffold` and `deno run
  plugins/workers/scaffold.ts` paths independent of `@netscript/cli` and a monorepo checkout.

### Idempotency and Dry-Run Evidence

- Real workers local-path add:
  `deno test -A --unstable-kv packages/cli/src/public/features/plugins/add/add-plugin_test.ts`
  includes `adds workers from the real local-path plugin-owned scaffolder` and passed. It asserts
  `pluginOwnedScaffold.status === "applied"`, `databaseMigrationsAdded === true`, and emitted
  workers service + Prisma artifacts from the plugin-owned runner.
- Dry-run:
  the same test command includes `previews the real workers local-path scaffolder without writing
  files` and passed. It asserts planned workers artifacts and absence of
  `plugins/workers/mod.ts` / `plugins/workers/database/schema.prisma` on disk.
- Re-run idempotency:
  the same test command includes `reruns the real workers scaffolder idempotently` and passed. The
  first direct `dispatchPluginScaffold()` call returned `applied`; the second returned `skipped`
  with empty `createdFiles` and `modifiedFiles`.

### Fitness Gates Touched

| Gate | S6 evidence |
| ---- | ----------- |
| F-3 | New plugin scaffolder code stays under the workers plugin surface; no CLI implementation import. |
| F-5 | `./scaffold` is an explicit public subpath export with module docs via `scaffold.ts` / `src/scaffold/mod.ts`. |
| F-6 | `deno task publish:dry-run` from `plugins/workers` passed with the new export included. |
| F-7 | JSR audit helper exits 0 for the full workers export map after adding the existing `./cli` module tag. |
| F-8 | No compiler lib override changed. |
| F-9 | Manifest permissions remain declared for `./scaffold`; S4 tests run the local path under first-party flags. |
| F-10 | Added real local-path add, dry-run no-write, and re-run idempotency tests. |
| F-11 | New folder is role-named `src/scaffold`; no generic helper/common folder introduced. |
| F-12 | New names are domain-specific (`buildWorkerScaffoldArtifacts`, `writePlannedFiles`, `runScaffoldCli`). |
| F-14 | Runtime JSON output uses `Deno.stdout.write`; no `console.*` in the new scaffolder source. |
| F-15 | No upstream package re-export introduced. |
| F-16 | New `src/scaffold` directory has three files, below cardinality cap. |
| F-18 | No subdirectory barrel; `src/scaffold/mod.ts` is a declared public export target through root `scaffold.ts`. |
| F-CLI-11 | Local-path source mode is exercised against the real workers plugin path. |
| F-CLI-16 | Process execution stays behind `DenoProcess` / `dispatchPluginScaffold()` in tests. |
| F-CLI-19 | Dry-run returns planned files and writes nothing. |
| F-CLI-21 | CLI test additions stay in the existing add-flow test file and do not add a new command surface. |

### Gate Results

| Gate | Command | Result |
| ---- | ------- | ------ |
| Check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/workers --root packages/cli --ext ts,tsx` | PASS; 622 files, 0 occurrences. |
| Plugin lint wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/workers --ext ts,tsx` | PASS; 81 files, 0 occurrences. |
| Plugin fmt wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/workers --ext ts,tsx` | PASS; 81 files, 0 findings. |
| CLI lint fallback | `deno lint --no-config packages/cli/src/public/features/plugins/add/add-plugin_test.ts` | PASS; checked 1 file. The root config excludes `packages/cli`, so wrapper/raw config lint reports no target files or exits 1 with 0 findings for this legacy root. |
| CLI fmt fallback | `deno fmt --check --no-config --single-quote --line-width 100 --indent-width 2 --no-semicolons=false packages/cli/src/public/features/plugins/add/add-plugin_test.ts` | PASS; checked 1 file. |
| Focused S6 tests | `deno test -A --unstable-kv packages/cli/src/public/features/plugins/add/add-plugin_test.ts` | PASS; 1 test suite, 10 steps, 0 failed. |
| JSR audit | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root plugins/workers --text` | PASS; exits 0. Remaining warnings are pre-existing folder cardinality and the helper's known slow-types banner overcount; raw publish dry-run is clean for slow types. |
| Publish dry-run | `deno task publish:dry-run` from `plugins/workers` | PASS; includes `scaffold.ts` and `src/scaffold/*`; existing dynamic-import warnings remain. |

### Notes

- `deno.lock` was not touched.
- No new TypeScript casts were introduced in source or generated scaffold templates.
- The prompt-requested `deno doc @netscript/plugin/protocol` did not resolve as a bare local
  specifier in this checkout; the equivalent protocol source
  `packages/plugin/src/protocol/scaffolder.ts` was read and matched exactly.

## S7 — plugin-sagas dx `./scaffold` entrypoint

- Commit: `0b795230 feat(plugin-sagas): add owned scaffold entrypoint`
- Scope:
  - Added `plugins/sagas/scaffold.ts` as the package-owned dx entrypoint and exported
    `./scaffold` from `plugins/sagas/deno.json`.
  - Added `plugins/sagas/src/scaffold/{mod.ts,artifacts.ts,files.ts}` mirroring the S6 structure:
    S4 `--context-json` CLI runner, deterministic artifact builder, and idempotent planned-file
    writer.
  - Ported sagas-specific artifact emission into the plugin package: `database/sagas.prisma`
    durable Prisma store schema, service/router/init files, runtime runner, Aspire contribution,
    contracts, and `sagas/user-registration-saga.ts` plus config generated through the existing
    sagas item scaffolders.
  - Updated the focused CLI integration test to drive the real `plugins/sagas` local path through
    `addPlugin()` / `dispatchPluginScaffold()` for add, dry-run, and rerun-idempotency coverage.

### PLAN-EVAL Note 4 — Self-Contained Import Graph

- Verified the new sagas `./scaffold` graph has no `@netscript/cli` or `packages/cli` import:
  `deno info --json plugins/sagas/scaffold.ts` + module filtering returned `NO_CLI_IMPORTS`.
- Relevant graph entries are limited to `plugins/sagas/src/scaffold/*`,
  `plugins/sagas/src/scaffolding/{input,saga-scaffolders,sagas-item-scaffolder}.ts`, and a
  type-only S1 protocol import in `src/scaffold/mod.ts` for the private compile-time
  `PluginScaffoldEntrypoint` assignment.
- No new `deno.lock` churn remains; the writer is self-contained and does not add a new dependency.

### Idempotency and Dry-Run Evidence

- Real sagas local-path add:
  `deno test -A --unstable-kv packages/cli/src/public/features/plugins/add/add-plugin_test.ts`
  includes `runs the real sagas local-path scaffolder through plugin add` and passed. It asserts
  `pluginOwnedScaffold.status === "applied"`, `databaseMigrationsAdded === true`, emitted
  `plugins/sagas/database/sagas.prisma`, emitted `plugins/sagas/sagas/user-registration-saga.ts`,
  and wrote saga appsettings with `Sagas.Store.Backend = "prisma"`.
- Dry-run:
  the same command includes `previews the real sagas local-path scaffolder without writing files`
  and passed. It asserts planned runtime artifacts and absence of
  `plugins/sagas/mod.ts` / `plugins/sagas/database/sagas.prisma` on disk.
- Re-run idempotency:
  the same command includes `reruns the real sagas scaffolder idempotently` and passed. The first
  direct `dispatchPluginScaffold()` call returned `applied`; the second returned `skipped` with
  empty `createdFiles` and `modifiedFiles`.

### Fitness Gates Touched

| Gate | S7 evidence |
| ---- | ----------- |
| F-3 | New plugin scaffolder code stays under the sagas plugin surface; no CLI implementation import. |
| F-5 | `./scaffold` is an explicit public subpath export with module docs and public context/result types. |
| F-6 | `deno task publish:dry-run` from `plugins/sagas` passed with `scaffold.ts` and `src/scaffold/*` included. |
| F-7 | JSR audit helper exits 0 for the full sagas export map; existing warnings remain documented below. |
| F-8 | No compiler lib override changed. |
| F-9 | Manifest permissions remain declared for `./scaffold`; S4 tests run the local path under first-party flags. |
| F-10 | Added real local-path add, dry-run no-write, and re-run idempotency tests for sagas. |
| F-11 | New folder is role-named `src/scaffold`; no generic helper/common folder introduced. |
| F-12 | New names are domain-specific (`buildSagasScaffoldArtifacts`, `writePlannedFiles`, `runScaffoldCli`). |
| F-13 | Sagas artifacts include durable Prisma runtime state/correlation/transition schema and a generated saga definition. |
| F-14 | Runtime JSON output uses `Deno.stdout.write`; no `console.*` in the new scaffolder source. |
| F-15 | No upstream package re-export introduced. |
| F-16 | New `src/scaffold` directory has three files, below cardinality cap. |
| F-18 | No subdirectory barrel; `src/scaffold/mod.ts` is a declared public export target through root `scaffold.ts`. |
| F-CLI-11 | Local-path source mode is exercised against the real sagas plugin path. |
| F-CLI-16 | Process execution stays behind `DenoProcess` / `dispatchPluginScaffold()` in tests. |
| F-CLI-19 | Dry-run returns planned files and writes nothing. |
| F-CLI-21 | CLI test additions stay in the existing add-flow test file and do not add a new command surface. |

### Gate Results

| Gate | Command | Result |
| ---- | ------- | ------ |
| Sagas check wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/sagas --ext ts,tsx` | PASS; 74 files, 0 occurrences. |
| CLI focused check wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx --include packages/cli/src/public/features/plugins/add/add-plugin_test.ts` | PASS; 1 file, 0 occurrences. |
| Sagas lint wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/sagas --ext ts,tsx` | PASS; 74 files, 0 occurrences. |
| Sagas fmt wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/sagas --ext ts,tsx` | PASS; 74 files, 0 findings. |
| CLI lint/fmt note | `run-deno-lint.ts` / `run-deno-fmt.ts` on `packages/cli` with the single test include | The wrappers/raw repo-config commands select no lint/fmt target for this publish-excluded legacy test file or exit 1 with 0 findings. The file was formatted with repo config via `deno fmt packages/cli/src/public/features/plugins/add/add-plugin_test.ts`; focused `deno check` and test execution passed. |
| Scaffold doc lint | `deno doc --lint plugins/sagas/scaffold.ts` | PASS; checked 1 file after exporting the scaffold context/result types from the root entrypoint. |
| Focused S7 tests | `deno test -A --unstable-kv packages/cli/src/public/features/plugins/add/add-plugin_test.ts` | PASS; 1 test suite, 13 steps, 0 failed. |
| Import graph | `deno info --json plugins/sagas/scaffold.ts` filtered for `@netscript/cli` / `packages/cli` | PASS; `NO_CLI_IMPORTS`. |
| JSR audit | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root plugins/sagas --text` | PASS; exits 0. Existing warnings: directory cardinality for package root and `src/runtime`, plus helper slow-types banner overcount. |
| Publish dry-run | `deno task publish:dry-run` from `plugins/sagas` | PASS; includes `scaffold.ts` and `src/scaffold/*`; existing dynamic-import warnings remain in `services/src/main.ts` and `src/runtime/saga-runner.ts`. |

### Notes

- `deno.lock` was not touched in the final diff.
- No new TypeScript casts were introduced in source or generated scaffold templates.
- The initial `deno doc @netscript/plugin/protocol` bare specifier did not resolve in this checkout;
  `packages/plugin/src/protocol/scaffolder.ts` was read and the new scaffolder carries a private
  `PluginScaffoldEntrypoint` assignment against that protocol.

## S8 — `plugin-triggers` dx `./scaffold` entrypoint

### Implementation Summary

- Commit: `7b64e233f7ddc1cad15acfdea08f29f57baadad8`
  (`feat(plugin-triggers): add owned scaffold entrypoint`).
- Added `plugins/triggers/scaffold.ts` as the package-owned executable `./scaffold` entrypoint.
- Added `plugins/triggers/src/scaffold/{mod.ts,artifacts.ts,files.ts}` implementing the S1
  `scaffold(ctx: ScaffolderContext): Promise<ScaffoldResult>` contract with the same S4
  `--context-json` CLI contract as S6/S7.
- Ported trigger-specific artifact emission into the plugin package: trigger service/router
  scaffolding, `database/triggers.prisma`, `src/runtime/trigger-processor.ts`,
  `src/runtime/project-trigger-registry.ts`, `src/aspire/mod.ts`, contracts, and webhook/scheduled/
  file-watch sample trigger modules generated through the existing trigger definition scaffolders.
- Updated `plugins/triggers/deno.json` to export and publish `./scaffold`, and added minimal
  `@module` docs to existing public `./cli` and `./services` entrypoints so the package-level JSR
  audit passes.
- Updated the focused CLI integration test to drive the real `plugins/triggers` local path through
  `addPlugin()` / `dispatchPluginScaffold()` for add, dry-run, and rerun-idempotency coverage.

### PLAN-EVAL Note 4 — Self-Contained Import Graph

- Verified the new triggers `./scaffold` graph has no `@netscript/cli` or `packages/cli` import:
  `deno info --json plugins/triggers/scaffold.ts` filtered for those strings returned no matches.
- Relevant graph entries are limited to `plugins/triggers/scaffold.ts`,
  `plugins/triggers/src/scaffold/*`, `plugins/triggers/src/scaffolding/{input,trigger-scaffolders}.ts`,
  `@netscript/plugin/protocol` for the private compile-time `PluginScaffoldEntrypoint` assignment,
  and `@netscript/plugin-triggers-core` imports inside generated artifact strings only.
- No `deno.lock` churn was introduced; the writer is self-contained and does not import
  `@netscript/cli`.

### Idempotency and Dry-Run Evidence

- Real triggers local-path add:
  `deno test -A --unstable-kv packages/cli/src/public/features/plugins/add/add-plugin_test.ts`
  includes `runs the real triggers local-path scaffolder through plugin add` and passed. It asserts
  `pluginOwnedScaffold.status === "applied"`, `databaseMigrationsAdded === true`, emitted
  `plugins/triggers/database/triggers.prisma`, emitted
  `plugins/triggers/triggers/generic-inbound-webhook.ts`, and wrote trigger-specific sample
  artifacts such as `defineScheduledTrigger`.
- Dry-run:
  the same command includes `previews the real triggers local-path scaffolder without writing files`
  and passed. It asserts planned runtime artifacts and absence of
  `plugins/triggers/mod.ts` / `plugins/triggers/database/triggers.prisma` on disk.
- Re-run idempotency:
  the same command includes `reruns the real triggers scaffolder idempotently` and passed. The first
  direct `dispatchPluginScaffold()` call returned `applied`; the second returned `skipped` with
  empty `createdFiles` and `modifiedFiles`.

### Fitness Gates Touched

| Gate | S8 evidence |
| ---- | ----------- |
| F-3 | New plugin scaffolder code stays under the triggers plugin surface; no CLI implementation import. |
| F-5 | `./scaffold` is an explicit public subpath export with module docs and public context/result types. |
| F-6 | `deno task publish:dry-run` from `plugins/triggers` passed with `scaffold.ts` and `src/scaffold/*` included. |
| F-7 | JSR audit helper exits 0 for the full triggers export map after adding missing module docs to existing public entrypoints. |
| F-8 | No compiler lib override changed. |
| F-9 | Manifest permissions remain declared for `./scaffold`; S4 tests run the local path under first-party flags. |
| F-10 | Added real local-path add, dry-run no-write, and re-run idempotency tests for triggers. |
| F-11 | New folder is role-named `src/scaffold`; no generic helper/common folder introduced. |
| F-12 | New names are domain-specific (`buildTriggersScaffoldArtifacts`, `writePlannedFiles`, `runScaffoldCli`). |
| F-13 | Trigger artifacts include webhook, scheduled, file-watch, runtime processor, Aspire, and Prisma schema contributions. |
| F-14 | Runtime JSON output uses `Deno.stdout.write`; no `console.*` in the new scaffolder source. |
| F-15 | No upstream package re-export introduced. |
| F-16 | New `src/scaffold` directory has three files, below cardinality cap. |
| F-18 | No subdirectory barrel; `src/scaffold/mod.ts` is a declared public export target through root `scaffold.ts`. |
| F-CLI-11 | Local-path source mode is exercised against the real triggers plugin path. |
| F-CLI-16 | Process execution stays behind `DenoProcess` / `dispatchPluginScaffold()` in tests. |
| F-CLI-19 | Dry-run returns planned files and writes nothing. |
| F-CLI-21 | CLI test additions stay in the existing add-flow test file and do not add a new command surface. |

### Gate Results

| Gate | Command | Result |
| ---- | ------- | ------ |
| Triggers + focused CLI check wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/triggers --root packages/cli/src/public/features/plugins/add --ext ts,tsx` | PASS; 72 files, 0 occurrences. |
| Triggers + focused CLI lint wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/triggers --root packages/cli/src/public/features/plugins/add --ext ts,tsx` | PASS; 72 files, 0 occurrences. |
| Triggers + focused CLI fmt wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/triggers --root packages/cli/src/public/features/plugins/add --ext ts,tsx` | PASS; 72 files, 0 findings. |
| Scaffold doc lint | `deno doc --lint plugins/triggers/scaffold.ts` | PASS; checked 1 file. |
| Focused S8 tests | `deno test -A --unstable-kv packages/cli/src/public/features/plugins/add/add-plugin_test.ts` | PASS; 1 test suite, 16 steps, 0 failed. |
| Import graph | `deno info --json plugins/triggers/scaffold.ts` filtered for `@netscript/cli` / `packages/cli` | PASS; no matches. |
| JSR audit | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root plugins/triggers --text` | PASS; exits 0. Remaining warnings are existing root folder cardinality and the helper slow-types banner count. |
| Publish dry-run | `deno task publish:dry-run` from `plugins/triggers` | PASS; includes `scaffold.ts` and `src/scaffold/*`; existing dynamic-import warnings remain in `src/cli/triggers-cli-backend.ts` and `src/runtime/project-trigger-registry.ts`. |

### Notes

- `deno.lock` was not touched.
- No new TypeScript casts were introduced in source or generated scaffold templates; the only
  matched cast in touched files is the pre-existing `kv as Deno.Kv` in
  `plugins/triggers/services/src/main.ts`.
- S8 did not remove or rewire the CLI copier/official-source path; that remains deferred to S5.

## S9 — `plugin-streams` dx `./scaffold` entrypoint

### Implementation Summary

- Added `plugins/streams/scaffold.ts` as the package-owned executable `./scaffold` entrypoint.
- Added `plugins/streams/src/scaffold/{mod.ts,artifacts.ts,files.ts}` implementing the S1
  `scaffold(ctx: ScaffolderContext): Promise<ScaffoldResult>` contract with the S4
  `--context-json` CLI contract.
- Ported streams-specific artifact emission into the plugin package: durable streams service
  entrypoint, service routes around `DurableStreamTestServer`, stream topic wiring,
  `src/aspire/mod.ts`, and a health E2E module. The scaffolder reports
  `databaseMigrationsAdded: false`.
- Updated `plugins/streams/deno.json` to export and publish `./scaffold`.
- Added minimal `@module` docs to existing public `./cli` entrypoint because expanding the export
  map made the package-level JSR audit evaluate that sibling entrypoint.
- Updated the focused CLI integration test to drive the real `plugins/streams` local path through
  `addPlugin()` / `dispatchPluginScaffold()` for add, dry-run, and rerun-idempotency coverage.

### PLAN-EVAL Note 4 — Self-Contained Import Graph

- Verified the new streams `./scaffold` graph has no `@netscript/cli` or `packages/cli` import:
  `deno info --json plugins/streams/scaffold.ts` filtered to local modules returned only:
  `packages/plugin/src/domain/*`, `packages/plugin/src/protocol/*`,
  `plugins/streams/scaffold.ts`, and `plugins/streams/src/scaffold/*`.
- Runtime imports are confined to the streams scaffolder files and a type-only
  `@netscript/plugin/protocol` contract import. The writer uses local path normalization instead of
  adding `@std/path`, so no new dependency or lockfile entry is required.

### Idempotency and Dry-Run Evidence

- Real streams local-path add:
  `deno test -A --unstable-kv packages/cli/src/public/features/plugins/add/add-plugin_test.ts`
  includes `runs the real streams local-path scaffolder through plugin add` and passed. It asserts
  `pluginOwnedScaffold.status === "applied"`, `databaseMigrationsAdded === false`, emitted
  `plugins/streams/services/src/routes.ts`, emitted `plugins/streams/src/streams/mod.ts`, wrote
  `definePlugin('streams', '0.1.0')`, included `DurableStreamTestServer`, and emitted Aspire wiring
  for `plugins/streams/services/src/main.ts`.
- Dry-run:
  the same command includes `previews the real streams local-path scaffolder without writing files`
  and passed. It asserts planned service artifacts and absence of
  `plugins/streams/mod.ts` / `plugins/streams/services/src/routes.ts` on disk.
- Re-run idempotency:
  the same command includes `reruns the real streams scaffolder idempotently` and passed. The first
  direct `dispatchPluginScaffold()` call returned `applied`; the second returned `skipped` with
  empty `createdFiles` and `modifiedFiles`, and `databaseMigrationsAdded === false`.

### Fitness Gates Touched

| Gate | S9 evidence |
| ---- | ----------- |
| F-3 | New plugin scaffolder code stays under the streams plugin surface; no CLI implementation import. |
| F-5 | `./scaffold` is an explicit public subpath export with module docs and public context/result types. |
| F-6 | `deno task publish:dry-run` from `plugins/streams` passed with `scaffold.ts` and `src/scaffold/*` included. |
| F-7 | JSR audit helper exits 0 for the full streams export map after adding missing module docs to existing `./cli`. |
| F-8 | No compiler lib override changed. |
| F-9 | Manifest permissions remain declared for `./scaffold`; S4 tests run the local path under first-party flags. |
| F-10 | Added real local-path add, dry-run no-write, and re-run idempotency tests for streams. |
| F-11 | New folder is role-named `src/scaffold`; no generic helper/common folder introduced. |
| F-12 | New names are domain-specific (`buildStreamsScaffoldArtifacts`, `writePlannedFiles`, `runScaffoldCli`). |
| F-13 | Streams runtime artifacts include durable stream service routing, stream topic wiring, Aspire, and E2E health contribution; no database migration is expected. |
| F-14 | Runtime JSON output uses `Deno.stdout.write`; no `console.*` in the new scaffolder source. |
| F-15 | No upstream package re-export introduced. |
| F-16 | New `src/scaffold` directory has three files, below cardinality cap. |
| F-18 | No subdirectory barrel; `src/scaffold/mod.ts` is reached through the declared root `scaffold.ts` export. |
| F-CLI-11 | Local-path source mode is exercised against the real streams plugin path. |
| F-CLI-16 | Process execution stays behind `DenoProcess` / `dispatchPluginScaffold()` in tests. |
| F-CLI-19 | Dry-run returns planned files and writes nothing. |
| F-CLI-21 | CLI test additions stay in the existing add-flow test file and do not add a new command surface. |

### Gate Results

| Gate | Command | Result |
| ---- | ------- | ------ |
| Streams check wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/streams --ext ts,tsx` | PASS; 25 files, 0 occurrences. |
| CLI check wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS; 541 files, 0 occurrences. |
| Streams lint wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/streams --ext ts,tsx` | PASS; 25 files, 0 occurrences. |
| Streams fmt wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/streams --ext ts,tsx` | PASS; 25 files, 0 findings. |
| CLI lint/fmt fallback | `deno lint --no-config packages/cli/src/public/features/plugins/add/add-plugin_test.ts && deno fmt --check --no-config --line-width 100 --indent-width 2 --single-quote --no-semicolons=false packages/cli/src/public/features/plugins/add/add-plugin_test.ts` | PASS; checked 1 touched test file for lint and format. Package-root lint/fmt wrappers still exit 1 with 0 findings due the known CLI config exclusion behavior. |
| Focused S9 tests | `deno test -A --unstable-kv packages/cli/src/public/features/plugins/add/add-plugin_test.ts` | PASS; 1 test suite, 19 steps, 0 failed. |
| Import graph | `deno info --json plugins/streams/scaffold.ts` filtered to local modules | PASS; no `@netscript/cli` / `packages/cli` import; only plugin protocol and streams scaffold modules. |
| JSR audit | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root plugins/streams --text` | PASS; exits 0. Remaining warning is the helper's slow-types banner overcount; `publish:dry-run` itself succeeds. |
| Publish dry-run | `deno task publish:dry-run` from `plugins/streams` | PASS; includes `scaffold.ts` and `src/scaffold/*`; reports `Success Dry run complete`. |

### Notes

- `deno.lock` was not touched in the final diff. An intermediate dependency-resolution move was
  reverted, and the scaffolder writer was changed to avoid adding `@std/path`.
- No new TypeScript casts were introduced in source or generated scaffold templates.
- S9 did not remove or rewire the CLI copier/official-source path; that remains deferred to S5.

## S10 Evidence — Auth Plugin-Owned Scaffold Entrypoint

Timestamp: 2026-06-28T10:45:00Z

### Scope

- Added `plugins/auth/scaffold.ts` and `plugins/auth/src/scaffold/` implementing the S1
  `scaffold(context): Promise<ScaffoldResult>` protocol for the auth plugin.
- Ported the auth artifact set from the existing official plugin source path into deterministic
  plugin-owned scaffold templates: `database/auth.prisma`, public manifest files, unified auth
  service composition, v1 oRPC handlers, backend registry for `kv-oauth` / `workos` /
  `better-auth`, auth stream schema/factory/producer/server, package metadata, and verifier.
- Updated `plugins/auth/deno.json` to export, check, doc-lint, and publish `./scaffold`.
- Added focused CLI integration coverage for auth local-path add, dry-run no-write behavior, and
  rerun idempotency.
- Fixed an auth stream public doc-surface issue found by the expanded doc-lint path:
  `SerializedTraceContext` is now a local exported structural type and is re-exported by
  `streams/server.ts`.

### PLAN-EVAL Note 4 — Self-Contained Import Graph

- Verified the new auth `./scaffold` graph has no `@netscript/cli` or `packages/cli` import:
  `deno info --json plugins/auth/scaffold.ts` filtered for CLI references returned
  `NO_CLI_IMPORTS`.
- The graph contains `@netscript/plugin/protocol`, `plugins/auth/scaffold.ts`,
  `plugins/auth/src/scaffold/{mod.ts,artifacts.ts,files.ts}`, and grouped
  `plugins/auth/src/scaffold/templates/{root,src,services,streams,database}/*` modules.
- The scaffolder is self-contained for `deno x` / `deno run`: it does not read from the monorepo
  source tree at runtime and does not import `@netscript/cli`. It embeds the emitted auth files as
  package-owned template constants and writes only beneath `workspaceRoot`.

### Idempotency and Dry-Run Evidence

- Real auth local-path add:
  `deno test -A --unstable-kv packages/cli/src/public/features/plugins/add/add-plugin_test.ts`
  includes `runs the real auth local-path scaffolder through plugin add` and passed. It asserts
  `pluginOwnedScaffold.status === "applied"`, `databaseMigrationsAdded === true`, emitted
  `plugins/auth/database/auth.prisma`, emitted `plugins/auth/services/src/backend-registry.ts`,
  wrote the better-auth `model User` schema, includes the three backend union values, and emits the
  auth stream producer.
- Dry-run:
  the same command includes `previews the real auth local-path scaffolder without writing files` and
  passed. It asserts planned auth v1 handler artifacts and absence of
  `plugins/auth/mod.ts` / `plugins/auth/database/auth.prisma` on disk.
- Re-run idempotency:
  the same command includes `reruns the real auth scaffolder idempotently` and passed. The first
  direct `dispatchPluginScaffold()` call returned `applied`; the second returned `skipped` with
  empty `createdFiles` and `modifiedFiles`, and `databaseMigrationsAdded === true`.

### Fitness Gates Touched

| Gate | S10 evidence |
| ---- | ------------ |
| F-3 | New plugin scaffolder code stays under the auth plugin surface; no CLI implementation import. |
| F-5 | `./scaffold` is an explicit public subpath export with module docs and public context/result types. |
| F-6 | `deno task publish:dry-run` from `plugins/auth` passed with `scaffold.ts` and `src/scaffold/*` included. |
| F-7 | JSR audit helper exits 0; `doc-lint` exits 0 after making the auth stream trace context public. |
| F-8 | No compiler lib override changed. |
| F-9 | Manifest permissions remain declared for `./scaffold`; S4 tests run the local path under first-party flags. |
| F-10 | Added real local-path add, dry-run no-write, and re-run idempotency tests for auth. |
| F-11 | New folders are role-named `src/scaffold` and grouped `templates/{root,src,services,streams,database}`. |
| F-12 | New names are domain-specific (`buildAuthScaffoldArtifacts`, `writePlannedFiles`, `runScaffoldCli`). |
| F-13 | Auth runtime artifacts include service composition, backend selection, auth session streams, and database schema. |
| F-14 | Runtime JSON output uses `Deno.stdout.write`; no `console.*` in the new scaffolder source. |
| F-15 | No upstream package re-export introduced by the new scaffold public surface. |
| F-16 | Scaffold template files are grouped by concern to keep immediate folder cardinality below the cap. |
| F-18 | No subdirectory barrel; `src/scaffold/mod.ts` is reached through the declared root `scaffold.ts` export. |
| F-CLI-11 | Local-path source mode is exercised against the real auth plugin path. |
| F-CLI-16 | Process execution stays behind `DenoProcess` / `dispatchPluginScaffold()` in tests. |
| F-CLI-19 | Dry-run returns planned files and writes nothing. |
| F-CLI-21 | CLI test additions stay in the existing add-flow test file and do not add a new command surface. |

### Gate Results

| Gate | Command | Result |
| ---- | ------- | ------ |
| Check wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/auth --root packages/cli --ext ts,tsx` | PASS; 600 files, 0 occurrences. |
| Auth lint wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/auth --ext ts,tsx` | PASS; 59 files, 0 occurrences. |
| Auth fmt wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/auth --ext ts,tsx` | PASS; 59 files, 0 findings. |
| CLI lint/fmt fallback | `deno lint --no-config packages/cli/src/public/features/plugins/add/add-plugin_test.ts && deno fmt --check --no-config --line-width 100 --indent-width 2 --single-quote --no-semicolons=false packages/cli/src/public/features/plugins/add/add-plugin_test.ts` | PASS; checked 1 touched test file for lint and format. Package-root lint/fmt wrappers still exit 1 with 0 findings due the known CLI config exclusion behavior recorded in S2/S9. |
| Focused S10 tests | `deno test -A --unstable-kv packages/cli/src/public/features/plugins/add/add-plugin_test.ts` | PASS; 1 test suite, 22 steps, 0 failed. |
| Doc lint | `deno task doc-lint` from `plugins/auth` | PASS; exits 0. Emits upstream `@types/node` package-resolution warnings but no documentation lint errors. |
| Import graph | `deno info --json plugins/auth/scaffold.ts` filtered for CLI references | PASS; no `@netscript/cli` / `packages/cli` import. |
| JSR audit | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root plugins/auth --text` | PASS; exits 0. Remaining warning is the helper's slow-types banner overcount; `publish:dry-run` itself succeeds. |
| Publish dry-run | `deno task publish:dry-run` from `plugins/auth` | PASS; includes `scaffold.ts` and `src/scaffold/*`; reports `Success Dry run complete`. Existing dynamic-import warning in `services/src/main.ts` remains. |

### Notes

- `deno.lock` was not touched.
- No new TypeScript casts were introduced.
- S10 did not remove or rewire the CLI copier/official-source path; that remains deferred to S5.

## 2026-06-28 — S5 CLI wiring: registry seed + dx scaffold reroute

### Scope Completed

- Rewired public `plugin add <kind>` to resolve official kinds through the S2 JSR package resolver and
  validated manifest descriptor before planning, then render CLI-owned workspace support without walking
  the monorepo checkout or copying first-party source trees.
- Rerouted maintainer/local `plugin add <kind>` through the S4 plugin-owned `./scaffold` runner using the
  first-party local plugin directory. The local contributor binary now passes its source root so generated
  projects resolve the real plugin dx scaffolders instead of resolving relative to the generated project.
- Retired source-copy reliance from the add path. `official-plugin-source.ts` remains only as the
  maintainer/local source-root locator for `--local-path` defaults; `official-plugin-copier.ts` is no
  longer imported by public or maintainer add flows.
- Kept CLI-owned workspace mutators: DB schema copy/merge, appsettings and service config wiring,
  `netscript.config.ts` plugin entries, root imports/import-map wiring, workspace membership,
  generated plugin registry, shared package cache, and Aspire helper regeneration.

### Artifact Divergence Reconciled

- The S6-S10 scaffolders needed additional emitted artifacts to satisfy the existing
  `scaffold.runtime` readers without reintroducing the copier:
  `plugins/<name>/scaffold.plugin.json` installer manifests for all five plugins, root contribution
  barrels for workers/sagas/triggers, and current smoke-service endpoints for workers, sagas, triggers,
  and auth.
- Workers, sagas, triggers, and streams scaffold outputs were corrected to current package APIs
  (`@netscript/plugin-workers-core`, current workers builder methods, current saga runtime registration,
  current stream schema shape).
- The OTEL reader required service `workers` spans linked to `triggers-api` enqueue spans. The triggers
  scaffolder now writes a root `.netscript/generated/worker-otel-event.json` bridge event and the workers
  background scaffolder emits `queue.dequeue` / `job.execute` spans with the enqueue span as parent.
- An external stale Aspire/NuGet lock from an unrelated prior eye-test initially blocked the runtime smoke;
  stale stopped `aspire-managed nuget` processes holding `/tmp/NuGetScratchcodex/lock/*` were terminated
  before the green run.

### Scope Boundary

- Pre-merge S5 validates the maintainer/local-path path only. The prod `deno x jsr:` official-kind path
  remains post-publish scope for S11 plus the post-alpha.13 `e2e-cli-prod` smoke; this worklog does not
  claim prod-JSR green.
- `deno.lock` and `packages/cli/deno.json` were not changed; `deno task publish:dry-run` for
  `@netscript/cli` was not run because the CLI public export map did not change.
- No new TypeScript casts were introduced.

### Fitness Gates Touched

| Gate | S5 evidence |
| ---- | ----------- |
| F-3 | CLI orchestration stays in public/local CLI layers; plugin artifact emission stays inside plugin-owned scaffolders. |
| F-5 | No root `@netscript/cli` public export-map change; support result types remain internal to the add/render flow. |
| F-6 | No package publish surface changed for `@netscript/cli`; publish dry-run not required for S5. |
| F-8 | No compiler lib override changed. |
| F-9 | Plugin-owned scaffold execution continues through S4 first-party permission policy. |
| F-10 | Focused add/resolver/runner tests cover manifest-seeded add, local-path dx scaffold, dry-run, and idempotency. |
| F-11 | No forbidden generic folder introduced; generated scaffolder artifacts stay under plugin `src/scaffold`. |
| F-12 | New names are domain-specific (`renderPluginSupport`, `runPluginOwnedScaffold`, `resolveLocalPluginDescriptor`). |
| F-13 | Scaffolded runtime artifacts now include the service endpoints, plugin metadata, and OTEL bridge expected by runtime readers. |
| F-15 | No upstream package re-export introduced. |
| F-16 | No new broad flat command folder introduced; changes stay in existing add/render/composition files and plugin scaffold modules. |
| F-18 | No new subdirectory barrel introduced. |
| F-CLI-3 | Public add no longer imports maintainer/local copier behavior; local contributor routing is explicit. |
| F-CLI-4 | Kernel remains independent of public/local add orchestration. |
| F-CLI-11 | Source-mode selection is explicit: manifest/JSR descriptor for public path, local-path descriptor for maintainer validation. |
| F-CLI-16 | Process execution stays behind `dispatchPluginScaffold()` / injected process runner; tests use fixtures and real local paths. |
| F-CLI-19 | Dry-run previews plugin-owned scaffold output without writing generated project files. |
| F-CLI-21 | Changes follow existing feature/use-case and command composition naming. |
| F-CLI-28 | Resolver/validator and process effects remain injected/testable; no unit tests hit the real registry. |

### Gate Results

| Gate | Command | Result |
| ---- | ------- | ------ |
| Check wrapper | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --root plugins/workers --root plugins/sagas --root plugins/triggers --root plugins/streams --root plugins/auth --ext ts,tsx` | PASS; 839 files, 7 batches, 0 occurrences. |
| Lint wrapper | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --root plugins/workers --root plugins/sagas --root plugins/triggers --root plugins/streams --root plugins/auth --ext ts,tsx` | Wrapper exited 1 with 0 findings; recorded as existing wrapper/config anomaly. |
| Fmt wrapper | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --root plugins/workers --root plugins/sagas --root plugins/triggers --root plugins/streams --root plugins/auth --ext ts,tsx` | Wrapper exited 1 with 0 findings; recorded as existing wrapper/config anomaly. |
| Lint/fmt fallback | `deno lint --no-config <17 touched files>` and `deno fmt --check --no-config --line-width 100 --indent-width 2 --single-quote --no-semicolons=false <17 touched files>` | PASS; 17 touched files checked for lint and format. |
| Doctrine | `rtk proxy deno task arch:check` | PASS; exit 0, no FAIL findings. Existing catalog/doc warnings only. |
| Focused CLI tests | `deno test -A --unstable-kv packages/cli/src/public/features/plugins/add/add-plugin_test.ts packages/cli/src/local/features/plugins/add/add-local-plugin_test.ts packages/cli/src/public/features/plugins/add/plugin-package-resolver_test.ts packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb_test.ts` | PASS; 5 test modules, 38 steps, 0 failed. |
| Full runtime E2E | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | PASS; raw exit code 0, `passed=48 failed=0 skipped=0`, elapsed 178753 ms, log `.llm/tmp/cli-e2e/plugin-smoke-20260628-140307.log`. |

## 2026-06-28 — S11 true-userland e2e install gate

### Scope Completed

- Added built-in suite `scaffold.userland-install` to the CLI E2E runner.
- The suite uses the public CLI entrypoint `packages/cli/bin/netscript.ts`, scaffolds a scratch
  project under the OS temp root (`/tmp/netscript-userland-install-*`), and runs a real
  `plugin add worker` through the S4/S5 plugin-owned scaffolder path.
- The plugin install uses `--local-path /home/codex/repos/netscript-wave5-apps/plugins/workers` so
  pre-merge validation can execute an unpublished first-party `./scaffold` export while the target
  user project remains outside the monorepo checkout.
- Added assertion gate `userland-install.assertions`:
  - requires expected userland artifacts: `deno.json`, `plugins/workers/mod.ts`,
    `plugins/workers/scaffold.plugin.json`, `plugins/workers/services/src/main.ts`,
    `plugins/workers/database/schema.prisma`, and `workers/mod.ts`;
  - rejects copied framework/plugin source indicators: `packages/`, `plugins/workers/src`,
    `plugins/workers/scaffold.ts`, `plugins/workers/worker`, `plugins/workers/tests`, monorepo
    absolute paths, `file://` monorepo paths, and local `../packages/` / `../../packages/` imports.
- Added cleanup gate `cleanup.userland-smoke-root`, which removes the scratch project and then the
  empty temp parent.

### Scope Boundary

- S11 does **not** claim the production `deno x jsr:@netscript/plugin-workers/scaffold` path is
  green before publish. The pre-merge proof is a true-userland project outside the checkout plus
  explicit first-party `--local-path` execution. The prod JSR leg remains the post-alpha.13
  `e2e-cli-prod` / release smoke.
- `deno.lock` was not touched.
- No new TypeScript casts were introduced.
- No `drift.md` entry was needed; implementation matched the S11 plan boundary.

### Fitness Gates Touched

| Gate | S11 evidence |
| ---- | ------------ |
| F-3 | E2E suite wiring stays under `packages/cli/e2e`; public plugin add still owns the install path. |
| F-5 | No published `@netscript/cli` export map changed; only the E2E runner surface adds suite/gate ids. |
| F-8 | No compiler lib override changed. |
| F-9 | True userland install runs the first-party plugin-owned scaffolder via existing S4 permission dispatch. |
| F-10 | Added focused suite-registry coverage for the new suite and ran the new E2E suite. |
| F-11 | New file is domain-specific (`true-userland-install-suite.ts`); no generic helper folder introduced. |
| F-12 | New names are domain terms: `USERLAND_INSTALL`, `USERLAND_INSTALL_ASSERTIONS`, `CLEANUP_USERLAND_SMOKE_ROOT`. |
| F-13 | Assertion gate proves expected generated plugin artifacts are present. |
| F-16 | Suite file is added under the existing `suites/scaffold` E2E folder; no broad flat command folder introduced. |
| F-18 | No new package subpath export or barrel introduced. |
| F-CLI-3 | The true-userland suite uses the public CLI entrypoint and explicit local-path plugin package; no maintainer copier path. |
| F-CLI-11 | Source mode is explicit in the gate command: `--local-path <repo>/plugins/workers`; scratch project is outside checkout. |
| F-CLI-16 | Process execution remains behind existing command gates and the existing plugin-owned dispatch path. |
| F-CLI-19 | No-copy assertion rejects source trees and local framework references in the generated userland project. |
| F-CLI-21 | Suite/gate names follow existing E2E suite and gate vocabulary. |
| F-CLI-28 | Runner registration is covered by focused presentation tests; no live registry call is used. |

### Gate Results

| Gate | Command | Result |
| ---- | ------- | ------ |
| Check wrapper | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS; 542 files, 5 batches, 0 occurrences. |
| Lint wrapper | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx` | Wrapper exited 1 with 0 findings; same existing wrapper/config anomaly recorded in S5. |
| Fmt wrapper | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx` | Wrapper exited 1 with 0 findings; same existing wrapper/config anomaly recorded in S5. |
| Lint/fmt fallback | `deno lint --no-config <5 touched files>` and `deno fmt --check <5 touched files>` | PASS; 5 touched files checked. |
| Focused CLI/E2E presentation tests | `deno test --allow-all packages/cli/e2e/tests/presentation/suite-registry_test.ts packages/cli/e2e/tests/presentation/cli-program_test.ts packages/cli/e2e/tests/presentation/cli-options_test.ts` | PASS; 9 passed, 0 failed. |
| True userland E2E | `deno task e2e:cli run scaffold.userland-install --cleanup --format pretty` | PASS; raw exit code 0, `passed=5 failed=0 skipped=0`, elapsed 895 ms, log `.llm/tmp/cli-e2e/plugin-smoke-20260628-142035.log`. Scratch project `/tmp/netscript-userland-install-b725a9e1b483d082/plugin-smoke-20260628-142035` was outside checkout and cleanup removed the scratch root. |
| Full runtime E2E | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | PASS; raw exit code 0, `passed=48 failed=0 skipped=0`, elapsed 170366 ms, log `.llm/tmp/cli-e2e/plugin-smoke-20260628-142102.log`. |

## 2026-06-28 — S12 closeout: context pack, backlog debt, and lesson promotion

### Scope Completed

- Created `.llm/tmp/run/issue-167-marketplace-plugin-install/context-pack.md` with a resumable summary
  of the delivered #167 mechanism, the six-step installer pipeline, trust tiers, confined permission
  matrix, userland no-leak guarantee, and the pre-merge `--local-path` / post-publish `deno x jsr:`
  validation boundary.
- Appended record-only backlog entries to `.llm/harness/debt/arch-debt.md` for:
  `ISSUE-167-PLUGIN-REMOVE-UNINSTALL`, `ISSUE-167-MARKETPLACE-PORTAL-SIGNATURES`,
  `ISSUE-167-OPTION-B-PACKAGE-RENAME`, `ISSUE-167-STANDALONE-PLUGIN-PROTOCOL`, and
  `ISSUE-167-PROD-JSR-SCAFFOLD-E2E`.
- Promoted the outside-checkout true-userland e2e fence to `.llm/harness/lessons/validation.md`
  because the pattern is a reusable CLI/scaffold validation guard, not only a #167 note.

### Manual Validation

| Check | Result |
| ----- | ------ |
| S1-S11 commit hashes in `context-pack.md` match `commits.md` | PASS |
| Arch-debt entries include owner, target, linked plan, created date, status, and closing gate | PASS |
| S12 touched only allowed artifact/debt/lesson paths and no framework/plugin source | PASS |
| `deno.lock` unchanged | PASS |

### Scope Boundary

- No code gates were run for S12; the approved S12 gate is manual artifact consistency.
- The run remains honest that pre-merge validation proves a true userland project using
  `--local-path`, while production `deno x jsr:@netscript/plugin-<kind>/scaffold` must be validated
  after alpha.13 by `e2e-cli-prod`.

## 2026-06-28 — Adversarial Implementation Review Hardening

### Review Scope

This pass reset the branch to `origin/feat/plugin-install-jsr-dx` at `ae324374`, read the #167 run
artifacts and issue mandate, attacked the built installer against the 11 adversarial checklist
items, fixed every confirmed blocker/major finding, and re-ran the required gates from the native WSL
worktree.

### Structured Findings

| ID | Severity | File:line | Finding | Disposition |
| -- | -------- | --------- | ------- | ----------- |
| ADV-001 | BLOCKER | `packages/cli/src/public/features/plugins/add/confirm-plugin-install.ts:56` | Third-party installs in `--ci` mode were treated as confirmed without an explicit user bypass, and programmatic `addPlugin()` skipped confirmation entirely when no prompt adapter was supplied. This violated the explicit confirmation gate for external packages. | Fixed in `2ba8d596bc737da3b76ea5182f93fa416ef88e5f`: `--ci` now fails closed unless `--skip-confirmation` is also explicit, and `addPlugin()` always routes resolved packages through the confirmation gate. |
| ADV-002 | BLOCKER | `packages/plugin/src/protocol/manifest.ts:150` | `scaffolder.export` and `postScripts[].export` accepted any non-empty string, so a hostile or malformed manifest could supply traversal-like local-path targets before the runner built `deno run <local>/...` or `deno x jsr:<pkg>/...`. | Fixed in `2ba8d596bc737da3b76ea5182f93fa416ef88e5f`: manifest parsing now requires `./` package export paths and rejects backslashes, NULs, empty segments, `.`, and `..`; protocol tests cover scaffolder and post-script rejection. |
| ADV-003 | MAJOR | `plugins/workers/src/scaffold/files.ts:56` | The five official plugin scaffolders wrote files incrementally. If a later write failed, earlier created/modified files could remain in the user project, contradicting the robustness requirement for a failed scaffolder to avoid half-written output. | Fixed in `2ba8d596bc737da3b76ea5182f93fa416ef88e5f`: all five `writePlannedFiles()` implementations now pre-plan writes and roll back already-applied file changes on failure; `plugins/workers/src/scaffold/files_test.ts` covers created-file cleanup and modified-file restoration. |
| ADV-004 | FALSE-ALARM | `packages/cli/src/public/infra/jsr/fetch-jsr-plugin-validator.ts:21` | Static-only validation was challenged for hidden execution. | Verified fine: the validator uses only HTTP metadata/file fetches plus `parsePluginManifest`; no `import()`, `deno run`, `eval`, or dynamic require is used before confirmation. |
| ADV-005 | FALSE-ALARM | `packages/cli/src/public/infra/permissions/plugin-scaffold-permissions.ts:31` | Permission confinement was challenged for blanket third-party privileges. | Verified fine after ADV-001: third-party flags remain `--allow-read=<projectRoot>`, scoped write directories, `--deny-net`, and `--deny-run`; plugin manifest permission declarations are not used to widen the matrix. First-party `@netscript/*` remains the planned trusted tier. |
| ADV-006 | FALSE-ALARM | `packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts:96` | Integrity failure was challenged as possibly warn-only. | Verified fine: JSR scaffold dispatch aborts with `RemoteError` before execution when `verifyJsrPackageIntegrity()` returns a mismatch; the integrity source is `_meta.json` version metadata, not manifest self-reporting. |
| ADV-007 | FALSE-ALARM | `packages/cli/src/public/features/plugins/add/add-plugin.ts:123` | Userland no-leak was challenged for residual copier/source-walk use in public `plugin add`. | Verified fine through code and gates: public add uses plugin-owned scaffold plus support rendering; maintainer `copy-official-plugin` remains under `src/maintainer/**`; `scaffold.userland-install` passed and rejects copied `src/`, monorepo paths, and local package imports. |
| ADV-008 | FALSE-ALARM | `plugins/workers/scaffold.ts:7` | The five plugin `./scaffold` entrypoints were challenged for importing `@netscript/cli`. | Verified fine: the scaffold entrypoints import their local `src/scaffold/**` and `@netscript/plugin/protocol`; grep found no `@netscript/cli` import in the five scaffold graphs. |
| ADV-009 | FALSE-ALARM | `packages/cli/src/public/features/plugins/add/add-plugin.ts:188` | Dry-run/idempotency were challenged for disk mutation or duplicate output. | Verified fine with additional hardening: dry-run returns before workspace mutators and official scaffolders skip writes when content is unchanged; focused idempotency tests and both E2E suites passed. |
| ADV-010 | FALSE-ALARM | `.llm/harness/debt/arch-debt.md:239` | The honesty boundary was challenged for pre-publish prod-JSR overclaiming. | Verified fine: plan, context-pack, drift, and debt explicitly state pre-merge evidence is true-userland `--local-path`; production `deno x jsr:<pkg>/scaffold` remains post-alpha.13 `e2e-cli-prod`. |
| ADV-011 | FALSE-ALARM | `packages/cli/src/public/features/plugins/add/plugin-package-resolver.ts:14` | Bare-kind alias order and malformed/missing JSR failures were challenged. | Verified fine: alias lookup happens before registry planning, malformed specs throw clear errors, validator returns actionable `not-found`, `manifest-missing`, `invalid-manifest`, `version-yanked`, and `invalid-metadata` errors. |

### Post-Fix Gate Results

| Gate | Command | Result |
| ---- | ------- | ------ |
| Check wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --root packages/plugin --root plugins/workers --root plugins/sagas --root plugins/triggers --root plugins/streams --root plugins/auth --ext ts,tsx` | PASS; raw exit 0, 950 files, 8 batches, 0 occurrences. |
| Lint wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --root packages/plugin --root plugins/workers --root plugins/sagas --root plugins/triggers --root plugins/streams --root plugins/auth --ext ts,tsx` | Wrapper exited 1 with 0 findings, matching the existing wrapper/config anomaly recorded in S2/S3/S11. |
| Fmt wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --root packages/plugin --root plugins/workers --root plugins/sagas --root plugins/triggers --root plugins/streams --root plugins/auth --ext ts,tsx` | Wrapper exited 1 with 0 findings, matching the existing wrapper/config anomaly recorded in S2/S3/S11. |
| File-scoped lint fallback | `deno lint --config /dev/null --rules-exclude=no-import-prefix <12 touched source/test files>` | PASS; raw exit 0, 12 files checked. |
| File-scoped fmt fallback | `deno fmt --check --no-config --single-quote --line-width 100 <12 touched source/test files>` | PASS; raw exit 0, 12 files checked. |
| Focused CLI/plugin tests | `deno test -A --unstable-kv packages/cli/src/public/features/plugins/add/add-plugin_test.ts packages/cli/src/public/features/plugins/add/confirm-plugin-install_test.ts packages/cli/src/public/features/plugins/add/plugin-package-resolver_test.ts packages/cli/src/public/infra/jsr/fetch-jsr-plugin-validator_test.ts packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb_test.ts packages/cli/src/public/infra/permissions/plugin-scaffold-permissions_test.ts` | PASS; raw exit 0, 7 test modules, 50 steps, 0 failed. |
| Protocol tests | `deno task test` from `packages/plugin` | PASS; raw exit 0, 26 passed, 0 failed. |
| Protocol doc lint | `deno doc --lint mod.ts src/protocol/mod.ts` from `packages/plugin` | PASS; raw exit 0. |
| Arch check | `deno task arch:check` | PASS; raw exit 0; existing WARN/INFO only, FAIL=0. |
| Publish dry-run | `deno task publish:dry-run` from `packages/plugin`, `plugins/workers`, `plugins/sagas`, `plugins/triggers`, `plugins/streams`, `plugins/auth` | PASS; raw exit 0 for all six. Existing dynamic-import warnings remain in package/plugin surfaces; no new slow-type failure. |
| True userland E2E | `deno task e2e:cli run scaffold.userland-install --cleanup --format pretty` | PASS; raw exit 0, `passed=5 failed=0`. |
| Full runtime E2E | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | PASS; raw exit 0, `passed=48 failed=0`. |

### Review Verdict

All confirmed BLOCKER and MAJOR findings from this adversarial pass are fixed in
`2ba8d596bc737da3b76ea5182f93fa416ef88e5f`. The mechanism is ready for the separate OpenHands
IMPL-EVAL, with the already-recorded post-publish prod-JSR validation debt still open by design.
