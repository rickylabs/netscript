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
