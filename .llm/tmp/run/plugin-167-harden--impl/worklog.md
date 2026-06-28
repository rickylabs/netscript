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
