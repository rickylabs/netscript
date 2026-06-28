# Worklog

## Design

- **Public surface:** additive `@netscript/plugin/protocol` export
  `stripPluginManifestSchemaKey`, additive raw JSON export `@netscript/plugin/schema`, root
  maintainer tasks `plugins:schema:gen` and later `plugins:check`.
- **Domain vocabulary:** plugin installer manifest, editor-only `$schema` hint, canonical JSON
  Schema, committed first-party manifests, scaffold-emitted manifests, stale NetScript version pins.
- **Ports:** no new production ports. S1 uses Deno file I/O only in `.llm/tools/plugin/*`; CLI
  validator call sites continue using existing HTTP and file-system ports.
- **Constants:** canonical schema path
  `packages/plugin/schema/scaffold.plugin.schema.json`; schema export id
  `jsr:@netscript/plugin/schema`; shipped plugin set `auth`, `sagas`, `streams`, `triggers`,
  `workers`; current protocol schema version `1`.
- **Commit slices:** S1 schema generation/export plus `$schema` strip and tests; S2 committed and
  emitted `$schema` wiring; S3 `plugins:check` plus `arch:check` CI promotion; S4 version
  single-source; S5 dead-code sweep.
- **Deferred scope:** uninstall/remove, marketplace portal/signatures, package rename, plugin
  README/doc-site work.
- **Contributor path:** schema contract changes start in
  `packages/plugin/src/protocol/manifest.ts`, then `deno task plugins:schema:gen`, then
  `packages/plugin/tests/protocol/plugin-manifest_test.ts`, then `deno task plugins:check` once S3
  exists.

## S1 progress

- Started from reconciled branch tip `1f57193f` after fast-forwarding the OpenHands PLAN-EVAL trace
  commits.
- Added `.llm/tools/plugin/generate-manifest-schema.ts` and reusable schema text generation from
  `PluginInstallerManifestSchema` using zod v4 native `z.toJSONSchema()`.
- Added the committed schema asset at `packages/plugin/schema/scaffold.plugin.schema.json` and
  exported it as `@netscript/plugin/schema` via `packages/plugin/deno.json`.
- Kept `PluginInstallerManifestSchema` strict and added
  `stripPluginManifestSchemaKey()` as an explicit pre-parse helper used by both CLI manifest parse
  call sites.

### S1 gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Manifest suite | PASS | `deno test --allow-all packages/plugin/tests/protocol/plugin-manifest_test.ts` — 8 passed. |
| Scoped check | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin --root packages/cli --ext ts,tsx` — 651 selected files, 0 failed batches. |
| Generator check | PASS | `deno check .llm/tools/plugin/generate-manifest-schema.ts`. |
| Scoped lint | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --file <S1 touched ts files> --pretty` — 7 selected files, 0 occurrences. |
| Scoped fmt | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file <S1 touched ts files> --pretty --ignore-line-endings` — 7 selected files, 0 findings. |
| Schema stability | PASS | `deno task plugins:schema:gen && git diff --exit-code -- packages/plugin/schema/scaffold.plugin.schema.json`. |
| Plugin publish dry-run | PASS | `deno publish --dry-run --allow-dirty --allow-slow-types` from `packages/plugin`; schema JSON checked and included in simulated file list. Existing package slow-type/dynamic-import warnings remain unchanged. |
| Lock hygiene | PASS | `git status --short deno.lock` returned no changes. |

## S2 progress

- Added the relative `$schema` path as the first key in all five committed
  `plugins/*/scaffold.plugin.json` manifests:
  `../../packages/plugin/schema/scaffold.plugin.schema.json`.
- Added the published schema export URL `jsr:@netscript/plugin/schema` as the first emitted manifest
  key in the five plugin-owned scaffold artifact generators.

### S2 gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Manifest suite | PASS | `deno test --allow-all packages/plugin/tests/protocol/plugin-manifest_test.ts` — 8 passed with committed `$schema` keys. |
| Parse all 5 manifests | PASS | `deno eval ... parsePluginManifest(stripPluginManifestSchemaKey(json))` — parsed 5 manifests. |
| Scoped lint | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --file plugins/*/src/scaffold/artifacts.ts --pretty` — 5 selected files, 0 occurrences. |
| Scoped TS fmt | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file plugins/*/src/scaffold/artifacts.ts --pretty --ignore-line-endings` — 5 selected files, 0 findings. |
| Manifest JSON fmt | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file plugins/*/scaffold.plugin.json --pretty --ignore-line-endings` — 5 selected files, 0 findings. |

## S3 progress

- Added deterministic `deno task plugins:check` via `.llm/tools/plugin/check-plugins.ts`.
- The gate validates all five committed manifests through the `$schema` strip path, byte-compares
  the committed schema against regenerated schema text, and scans plugin scaffold sources for stale
  NetScript version pins against the root workspace version.
- Wired `plugins:check` into `deno task arch:check`.
- Added an explicit `Architecture checks` step to the CI `quality` job, promoting `arch:check` from
  local-only to CI-enforced for #156.

### S3 gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| `plugins:check` | PASS | `deno task plugins:check` — `plugins:check passed`. |
| `arch:check` | PASS | `deno task arch:check` exited 0; includes `deps:check`, `plugins:check`, and existing doctrine checks. Existing dependency/doctrine warnings remain warnings only. |
| Tool check/lint | PASS | `deno lint --config /dev/null .llm/tools/plugin/check-plugins.ts && deno check .llm/tools/plugin/check-plugins.ts`. |
| Scoped fmt | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file .llm/tools/plugin/check-plugins.ts --file .llm/tools/plugin/manifest-schema.ts --file .llm/tools/plugin/generate-manifest-schema.ts --file deno.json --file .github/workflows/ci.yml --pretty --ignore-line-endings` — 4 selected files, 0 findings. |
| CI YAML | PASS | `deno eval --no-lock 'import { parse } from "jsr:@std/yaml@^1"; ...'` — `ci.yml yaml valid`. |
| Schema stability | PASS | `deno task plugins:schema:gen && git diff --exit-code -- packages/plugin/schema/scaffold.plugin.schema.json`. |
| Lock hygiene | PASS | `deno.lock` churn from YAML validation was removed; no `deno.lock` change remains. |

## S4 progress

- Adopted the primary version-coherence path: plugin scaffold artifact emitters import their own
  package `deno.json` and derive `NETSCRIPT_VERSION` from that JSON import.
- Removed hardcoded `0.0.1-alpha.12` literals from the workers, sagas, streams, triggers, and auth
  scaffold emitters.
- Normalized auth to the same pattern for its scaffold manifest and generated root `deno.json`; the
  auth root deno-json template now uses `__NETSCRIPT_VERSION__` placeholders replaced from the
  imported package version.
- Did not touch `.llm/tools/release/cut.ts`; release tooling already bumps plugin `deno.json`, which
  is now the single source.

### S4 gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Stale-pin scan | PASS | `deno task plugins:check` — `plugins:check passed`; `rg "0\\.0\\.1-alpha\\.12" plugins/*/src/scaffold -n` found no matches. |
| Scoped plugin check | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins --ext ts,tsx` — 299 selected files, 0 failed batches. |
| Scoped lint | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --file plugins/*/src/scaffold/artifacts.ts --file plugins/auth/src/scaffold/templates/root/deno-json.ts --pretty` — 6 selected files, 0 occurrences. |
| Scoped fmt | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file plugins/*/src/scaffold/artifacts.ts --file plugins/auth/src/scaffold/templates/root/deno-json.ts --pretty --ignore-line-endings` — 6 selected files, 0 findings. |
| Full scaffold runtime e2e | PASS | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` — 48 passed, 0 failed. |
| Generated pin inspection | PASS | Latest retained workspace `.llm/tmp/cli-e2e/plugin-smoke-20260628-174019` pins generated plugin manifests and `@netscript/*` plugin dependencies to current package version `0.0.1-alpha.12`; this branch is not version-bumped to alpha.13 yet. |
| Lock hygiene | PASS | `git status --short deno.lock` returned no changes. |

## S5 progress

- Removed `packages/cli/src/public/templates/plugins/public-plugin-generators.ts`, a public
  re-export barrel for the older CLI-embedded plugin generator surface.
- Verified the underlying kernel plugin generators remain in use by `PluginScaffolder`; only the
  unreferenced public barrel was removed.
- Left public `plugin scaffold` command wiring and the active `packages/cli/scaffolding.ts` surface
  intact because they are still referenced by tests and module exports.
- No ambiguous dead-code candidates were deleted.

### S5 gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Scoped check | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --root packages/plugin --root plugins --ext ts,tsx` — 949 selected files, 0 failed batches. |
| Full lint | PASS | `deno task lint` — 1266 selected files, 0 occurrences. |
| Scoped fmt | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/src/public/templates --ext ts,tsx --pretty --ignore-line-endings` — 0 selected files after the deleted barrel, 0 findings. |
| `plugins:check` | PASS | `deno task plugins:check` — `plugins:check passed`. |
| `arch:check` | PASS | `deno task arch:check` exited 0; existing dependency/doctrine findings remain warning-only. |
| Full test | PASS | `deno task test` — 927 passed, 0 failed, 12 ignored. |
| Full scaffold runtime e2e | PASS | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` — 48 passed, 0 failed. |
| Lock hygiene | PASS | `git status --short deno.lock` returned no changes. |

## Final implementation summary

- S1 added the generated canonical scaffold manifest JSON Schema, raw `./schema` package export, and
  `$schema` strip-before-parse tolerance without widening the strict manifest contract.
- S2 wired schema hints into all five committed plugin manifests and userland emitted manifests.
- S3 added deterministic `plugins:check` coverage and promoted `arch:check` into CI for #156.
- S4 removed hardcoded scaffold version pins and derived emitted pins from each plugin package
  `deno.json`, leaving `release:cut` untouched.
- S5 removed the only provably unreferenced CLI public plugin-generator barrel found in the
  dead-code sweep, with full test and scaffold runtime gates green.

## Adversarial review fixes

- Fixed the load-bearing schema URL finding: emitted userland scaffold manifests now set `$schema`
  to the version-pinned, fetchable JSR raw asset URL derived from the imported plugin package
  version:
  `https://jsr.io/@netscript/plugin/${NETSCRIPT_VERSION}/schema/scaffold.plugin.schema.json`.
- Kept the five committed in-repo `plugins/*/scaffold.plugin.json` manifests on their relative
  schema path for local editor use.
- Regenerated the committed schema with the stable HTTPS `$id`
  `https://rickylabs.github.io/netscript/schemas/scaffold.plugin.schema.json`; see `drift.md` for
  the docs-domain rationale.
- Hardened `plugins:check` so a literal `NETSCRIPT_VERSION = "<semver>"` under
  `plugins/*/src/scaffold/**/*.ts` fails even when the literal equals the current workspace version.
- Removed the missed unused `SCAFFOLD_FILES` import from
  `packages/cli/src/maintainer/adapters/official-plugin-source.ts`.

### Adversarial fix gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| JSR raw URL form | PASS | `curl -I -L https://jsr.io/@std/assert/1.0.14/mod.ts` and `/deno.json` returned HTTP 200; `https://jsr.io/@std/assert@1.0.14/mod.ts` returned 404, confirming the `<version>/<path>` form. |
| Schema regeneration + check | PASS | `deno task plugins:schema:gen && deno task plugins:check` — `plugins:check passed`. |
| No stale userland schema/literal pins | PASS | `rg "NETSCRIPT_VERSION\\s*=\\s*['\\\"][0-9]+\\.[0-9]+\\.[0-9]+|jsr:@netscript/plugin/schema" plugins/*/src/scaffold packages/plugin/schema .llm/tools/plugin` returned no matches. |
| `arch:check` | PASS | `deno task arch:check` exited 0; existing dependency/doctrine findings remain warning-only. |
| Scoped check | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --root packages/plugin --root plugins --ext ts,tsx` — 949 selected files, 0 failed batches. |
| Scoped lint | PASS | Wrapper lint passed for owned tool/plugin files (8 files), `packages/plugin` + `plugins` (408 files), and Deno root config intentionally excludes `packages/cli`; `deno check` covers the changed CLI file. |
| Scoped fmt | PASS | Wrapper fmt passed for owned tool/plugin files (8 files), `packages/plugin` + `plugins` (408 files), and Deno root config intentionally excludes `packages/cli`; no source formatting changes were needed. |
| Plugin publish dry-run | PASS | `deno publish --dry-run --allow-dirty` from `packages/plugin` exited 0 and included `schema/scaffold.plugin.schema.json`; existing dynamic-import warning remains unchanged. |
| Full test | PASS | `deno task test` — 927 passed, 0 failed, 12 ignored. |
| Lock hygiene | PASS | `git status --short deno.lock` returned no changes. |
| Scaffold runtime e2e | SKIPPED | Not rerun; the fix changes emitted `$schema` string content only, and the previously green runtime smoke does not assert that value. |

## C1 progress — scaffold value surface

- Added the additive `@netscript/plugin/scaffold` export map entry.
- Added the documented C1 value primitives: `ScaffoldArtifact` and `scaffoldSchemaUrl(version)`.
- Added a documented scaffold barrel with `@module` and `@example`; re-exported the protocol
  scaffold types and `PluginLogger` so the full doc-lint surface is complete.
- Added `@std/text` to the `@netscript/plugin` import map and added `src/scaffold/mod.ts` to the
  package check task.
- Added a first-party casing parity test for `workers`, `sagas`, `streams`, `triggers`, and `auth`.
- Inspected and removed resolver-only `deno.lock` churn; no lockfile change is committed.

### C1 gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Scoped check | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin --ext ts,tsx` — 113 files selected, 0 failed batches. |
| Scoped lint | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin --ext ts,tsx` — 113 files selected, 0 occurrences. |
| Scoped fmt | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin --ext ts,tsx` — 113 files selected, 0 findings. |
| Focused scaffold test | PASS | `deno test --allow-all packages/plugin/tests/scaffold/scaffold-surface_test.ts` — 2 passed. |
| Scaffold doc lint | PASS | `deno doc --lint packages/plugin/src/scaffold/mod.ts` — checked 1 file. |
| Plugin publish dry-run | PASS | `deno publish --dry-run --allow-dirty --allow-slow-types` from `packages/plugin` — dry run complete; existing package slow-type/dynamic-import warnings unchanged. |
| Full test | PASS | `deno task test` — 929 passed, 0 failed, 12 ignored. |
| Lock hygiene | PASS | `git diff -- deno.lock` returned no diff before commit. |

## C2 progress — scaffold manifest builder

- Added `PluginScaffoldManifestSpec` and `buildScaffoldPluginJson(spec, version)` to the scaffold
  subpath.
- Centralized the manifest envelope: schema URL, schema version, plugin version, `@netscript/plugin`
  peer dependency, and the standard scaffolder permission declaration.
- Kept the builder default on the JSR schema URL while allowing a documented `schemaUrl` override
  for repository-local committed manifests.
- Added byte-equality coverage for all five committed `plugins/*/scaffold.plugin.json` files.
- Added a small JSON formatter inside the builder so output matches Deno-formatted committed
  manifests, including inline short scalar arrays.
- Inspected and removed resolver-only `deno.lock` churn; no lockfile change is committed.

### C2 gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Manifest byte equality | PASS | `deno test --allow-all packages/plugin/tests/scaffold/scaffold-manifest-spec_test.ts` — 1 passed, all five committed manifests byte-equal. |
| Scoped check | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin --ext ts,tsx` — 115 files selected, 0 failed batches. |
| Scoped lint | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin --ext ts,tsx` — 115 files selected, 0 occurrences. |
| Scoped fmt | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin --ext ts,tsx` — 115 files selected, 0 findings. |
| Scaffold doc lint | PASS | `deno doc --lint packages/plugin/src/scaffold/mod.ts` — checked 1 file. |
| Full test | PASS | `deno task test` — 930 passed, 0 failed, 12 ignored. |
| Lock hygiene | PASS | `git diff -- deno.lock` returned no diff before commit. |

## C3 progress — scaffold base and CLI runner

- Added `DenoFileSystemAdapter` implementing the existing `FileSystemPort` with parent-directory
  creation.
- Added `PluginScaffolder`, a constructor-injected abstract base that owns the common
  `ScaffolderContext` → artifact diff/write → `ScaffoldResult` flow.
- Added `toEntrypoint()` so plugin `./scaffold` modules can expose the protocol entrypoint in one
  line.
- Added `parseScaffolderContextArgs()` and `runScaffoldCli(entrypoint)` preserving the existing
  `--context-json` CLI invocation contract.
- Added memory-adapter unit coverage for dry-run planning, write application, empty plans,
  `.prisma` database migration detection, and context-json parsing.
- Inspected and restored resolver-only `deno.lock` churn to HEAD; no lockfile change is committed.

### C3 gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Base scaffolder tests | PASS | `deno test --allow-all packages/plugin/tests/scaffold/plugin-scaffolder_test.ts` — 5 passed. |
| Scoped check | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin --ext ts,tsx` — 119 files selected, 0 failed batches. |
| Scoped lint | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin --ext ts,tsx` — 119 files selected, 0 occurrences. |
| Scoped fmt | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin --ext ts,tsx` — 119 files selected, 0 findings. |
| Scaffold doc lint | PASS | `deno doc --lint packages/plugin/src/scaffold/mod.ts` — checked 1 file. |
| Full test | PASS | `deno task test` — 935 passed, 0 failed, 12 ignored. |
| Lock hygiene | PASS | `git diff -- deno.lock` returned no diff before commit. |

## C4 progress — workers and streams migration

- Migrated workers and streams from duplicated scaffold primitives to the core scaffold surface.
- Added per-plugin `spec.ts` files and concrete `WorkersScaffolder` / `StreamsScaffolder` classes
  extending `PluginScaffolder`.
- Slimmed both plugin `src/scaffold/mod.ts` files to `toEntrypoint(...)` plus core
  `runScaffoldCli(scaffold)`.
- Updated both top-level `scaffold.ts` wrappers to call the core CLI runner.
- Replaced local casing helpers with direct `@std/text` imports.
- Replaced local manifest-envelope generation with `buildScaffoldPluginJson`.
- Deleted workers/streams local `files.ts`; deleted workers `files_test.ts` because C3 core tests now
  cover the port/base behavior.
- Inspected and restored resolver-only `deno.lock` churn to HEAD; no lockfile change is committed.

### C4 gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Scoped workers/streams check | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/workers --root plugins/streams --ext ts,tsx` — 106 files selected, 0 failed batches. |
| Scoped workers/streams lint | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/workers --root plugins/streams --ext ts,tsx` — 106 files selected, 0 occurrences. |
| Scoped workers/streams fmt | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/workers --root plugins/streams --ext ts,tsx` — 106 files selected, 0 findings. |
| Manifest check | PASS | `deno task plugins:check` — `plugins:check passed`. |
| Focused manifest tests | PASS | `deno test --allow-all plugins/workers/tests/public/manifest_test.ts plugins/streams/tests/public/manifest_test.ts` — 2 passed. |
| Full test | PASS | `deno task test` — 933 passed, 0 failed, 12 ignored. |
| Lock hygiene | PASS | `git diff -- deno.lock` returned no diff before commit. |

## C5b progress — common scaffold skeleton extraction

- Added core `buildPluginDenoJson(spec, version)` for the generated-plugin `deno.json` envelope.
- Added core `buildStandardScaffoldArtifacts(...)` for the standard first artifact trio:
  `scaffold.plugin.json`, `deno.json`, and `mod.ts`.
- Updated workers, streams, sagas, and triggers to use the core helpers while keeping
  plugin-specific exports, tasks, imports, and template bodies local.
- Recorded the auth byte-stability boundary in `drift.md`; auth keeps its published-package
  `deno.json` template because centralizing it would change package metadata, publish config,
  compiler options, and task fields.
- Restored resolver-only `deno.lock` churn to HEAD; no lockfile change is committed.
- Posted PR #170 comment: https://github.com/rickylabs/netscript/pull/170#issuecomment-4827034967

### C5b gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused scaffold helper tests | PASS | `deno test --allow-all packages/plugin/tests/scaffold/deno-json_test.ts packages/plugin/tests/scaffold/scaffold-manifest-spec_test.ts` — 3 passed. |
| Scoped check | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin --root plugins/workers --root plugins/streams --root plugins/sagas --root plugins/triggers --ext ts,tsx` — 361 files selected, 0 failed batches. |
| Scaffold doc lint | PASS | `deno doc --lint packages/plugin/src/scaffold/mod.ts` — checked 1 file. |
| Scoped lint | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin --root plugins/workers --root plugins/streams --root plugins/sagas --root plugins/triggers --ext ts,tsx` — 361 files selected, 0 occurrences. |
| Scoped fmt | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin --root plugins/workers --root plugins/streams --root plugins/sagas --root plugins/triggers --ext ts,tsx` — 361 files selected, 0 findings. |
| Manifest check | PASS | `deno task plugins:check` — `plugins:check passed`. |
| Full test | PASS | `deno task test` — 935 passed, 0 failed, 12 ignored. |
| Lock hygiene | PASS | `git diff -- deno.lock` returned no diff before commit. |

## C5 progress — sagas, triggers, and auth migration

- Migrated sagas, triggers, and auth onto the core scaffold surface.
- Added per-plugin `spec.ts` data files and concrete `SagasScaffolder`,
  `TriggersScaffolder`, and `AuthScaffolder` classes extending `PluginScaffolder`.
- Slimmed all three plugin `src/scaffold/mod.ts` files to `toEntrypoint(...)` plus core
  `runScaffoldCli(scaffold)`.
- Updated all three top-level `scaffold.ts` wrappers to call the core CLI runner.
- Replaced sagas/triggers local casing helpers with direct `@std/text` imports.
- Replaced local manifest-envelope generation with `buildScaffoldPluginJson`.
- Deleted sagas/triggers/auth local `files.ts` adapters.
- Restored resolver-only `deno.lock` churn to HEAD; no lockfile change is committed.
- Posted PR #170 comment: https://github.com/rickylabs/netscript/pull/170#issuecomment-4827019505

### C5 gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Scoped sagas/triggers/auth check | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/sagas --root plugins/triggers --root plugins/auth --ext ts,tsx` — 192 files selected, 0 failed batches. |
| Scoped sagas/triggers/auth lint | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/sagas --root plugins/triggers --root plugins/auth --ext ts,tsx` — 192 files selected, 0 occurrences. |
| Scoped sagas/triggers/auth fmt | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/sagas --root plugins/triggers --root plugins/auth --ext ts,tsx` — 192 files selected, 0 findings. |
| Manifest check | PASS | `deno task plugins:check` — `plugins:check passed`. |
| Focused manifest tests | PASS | `deno test --allow-all plugins/sagas/tests/public/manifest_test.ts plugins/triggers/tests/public/manifest_test.ts plugins/auth/tests/public/manifest_test.ts plugins/auth/tests/scaffold/manifest_test.ts` — 5 passed. |
| Full test | PASS | `deno task test` — 933 passed, 0 failed, 12 ignored. |
| Lock hygiene | PASS | `git diff -- deno.lock` returned no diff before commit. |

## C6 progress — final verification

- Ran the full merge-readiness verification matrix for scaffold-core centralization.
- Runtime E2E smoke completed from the native worktree with cleanup enabled.
- Publish dry-runs completed for `@netscript/plugin`, workers, streams, sagas, triggers, and auth.
- Restored resolver-only `deno.lock` churn to HEAD; no lockfile change is committed.
- C6 commit: this final verification evidence commit.

### C6 gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Manifest check | PASS | `deno task plugins:check` — `plugins:check passed`. |
| Architecture check | PASS | `deno task arch:check` — exit 0; warnings only, no failures. |
| Full scaffold doc lint | PASS | `deno doc --lint packages/plugin/src/scaffold/artifact.ts packages/plugin/src/scaffold/cli.ts packages/plugin/src/scaffold/deno-json.ts packages/plugin/src/scaffold/manifest-spec.ts packages/plugin/src/scaffold/mod.ts packages/plugin/src/scaffold/plugin-scaffolder.ts packages/plugin/src/scaffold/schema-url.ts packages/plugin/src/scaffold/standard-artifacts.ts` — checked 8 files. |
| Scoped package/plugin check | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin --root plugins --ext ts,tsx` — 420 files selected, 0 failed batches. |
| Scoped package/plugin lint | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin --root plugins --ext ts,tsx` — 420 files selected, 0 occurrences. |
| Scoped package/plugin fmt | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin --root plugins --ext ts,tsx` — 420 files selected, 0 findings. |
| Full test | PASS | `deno task test` — 935 passed, 0 failed, 12 ignored. |
| Runtime E2E | PASS | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` — passed=48 failed=0. |
| Publish dry-runs | PASS | `deno publish --dry-run --allow-dirty` from `packages/plugin`, `plugins/workers`, `plugins/streams`, `plugins/sagas`, `plugins/triggers`, and `plugins/auth` — all exited 0; existing dynamic-import warnings only. |
| Lock hygiene | PASS | `git diff -- deno.lock` returned no diff before commit. |
