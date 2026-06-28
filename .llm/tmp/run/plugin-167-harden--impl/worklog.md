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
