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
