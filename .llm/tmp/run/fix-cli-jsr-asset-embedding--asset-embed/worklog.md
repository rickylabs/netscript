# Worklog — fix-cli-jsr-asset-embedding--asset-embed

## Design

### Public Surface

- `@netscript/cli` keeps its existing public exports and binary surface.
- New internal generated CLI asset barrel:
  `packages/cli/src/kernel/assets/embedded.generated.ts` exports
  `EMBEDDED_TEMPLATE_CONTENT: Record<TemplateKey, string>`.
- New root tasks:
  - `gen:assets-barrel`
  - `check:assets-barrel`

### Domain Vocabulary

- `TemplateKey` remains the single asset identifier for CLI template assets.
- `TemplateValue` is now `{ path: TemplateKey; content: string }`.
- Embedded content map means every registry entry is content-backed at module load.

### Ports

- Existing `Manifest<TemplateKey, TemplateValue>` remains the registry abstraction.
- Existing `readTemplateAsset` / `readTemplateAssetSync` remain the adapter entrypoints, but accept
  only `TemplateKey`.

### Constants

- `TEMPLATE_KEYS` / `TEMPLATE_MANIFEST` remain the finite template vocabulary.
- `EMBEDDED_TEMPLATE_CONTENT` is generated from `TEMPLATE_MANIFEST`.

### Commit Slices

1. S1 — CLI embedded registry + kill URL overload.
   Gate: scoped check, barrel no-diff, focused template tests, scoped fmt/lint.
2. S2 — plugin skeleton embedded templates.
   Gate: CLI check, plugin doc-lint/dry-run, plugin scaffold smoke.
3. S3 — fresh-ui embedded registry.
   Gate: CLI/fresh-ui check, full export doc-lint, publish dry-run, scaffold runtime smoke.

### Deferred Scope

- Bucket-B maintainer/local reads are out of scope.
- Plugin-copy/userland `plugins/` surfacing is out of scope.
- `e2e-cli-prod` waits for the published alpha.5 release train.

### Contributor Path

To add a CLI template, add the `.template` file under `packages/cli/src/kernel/assets/`, add the
path to `TEMPLATE_KEYS`, run `deno task gen:assets-barrel`, then run
`deno task check:assets-barrel`.

## S1 — CLI embedded registry + kill URL overload

### Implementation

- Added `.llm/tools/generate-cli-assets-barrel.ts` and root `gen:assets-barrel` /
  `check:assets-barrel` tasks.
- Generated `packages/cli/src/kernel/assets/embedded.generated.ts` with one static
  `with { type: 'text' }` import per template asset.
- Rewrote `TemplateRegistry` so every entry is backed by `EMBEDDED_TEMPLATE_CONTENT`; removed
  `ASSET_ROOT_URL`, `url`, and the `fetch()` hydration loop.
- Removed `URL` overloads from `readTemplateAsset` and `readTemplateAssetSync`.
- Converted service, database, plugin registry, and Windows env template writers from
  `new URL(..., import.meta.url)` reads to `TemplateKey` reads/renders.

### Validation

| Gate | Command | Result |
| --- | --- | --- |
| scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --root packages/plugin --root packages/fresh-ui --ext ts,tsx` | PASS — 709 files, 6 batches, 0 diagnostics |
| assets barrel | `deno task check:assets-barrel` | PASS — regenerate + generated barrel diff clean |
| focused tests | `deno test --allow-read --allow-net packages/cli/src/kernel/application/registries/template-registry_test.ts packages/cli/src/kernel/adapters/templates/template-asset_test.ts` | PASS — 4 tests |
| scoped fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file <S1 files> --ext ts,tsx --ignore-line-endings --pretty` | PASS — 10 files, 0 findings |
| scoped lint | `deno lint --config /dev/null --rules-exclude=no-import-prefix <S1 files>` | PASS — 10 files |

### Notes

- Root lint/fmt wrappers over `packages/cli` are not usable as a raw S1 verdict because the root
  config excludes `packages/cli`; the explicit-file checks above are the scoped evidence for the
  touched files.
- `deno.lock` was briefly touched by the generator before the task was changed to `--no-lock`; the
  unnecessary lock diff was reverted.
- Branch push succeeded with `git push origin HEAD:refs/heads/fix/cli-jsr-asset-embedding`.
  GitHub API returned no PR for the branch, so there was no PR comment target for S1.

## S2 — Plugin skeleton embedded content

### Implementation

- Extended `.llm/tools/generate-cli-assets-barrel.ts` so `deno task gen:assets-barrel` also
  generates `packages/plugin/src/kernel/assets/embedded.generated.ts`.
- Added `PLUGIN_SKELETON_TEMPLATE_CONTENT: Record<PluginSkeletonTemplatePath, string>` to
  `@netscript/plugin/templates`.
- Rewrote the public CLI plugin scaffold use case to consume embedded template content instead of a
  `templateRoot` plus filesystem reads.
- Removed the eager `import.meta.resolve('@netscript/plugin')` / `fromFileUrl(new URL(...))` crash
  path from `public-command-dependencies.ts`.

### Validation

| Gate | Command | Result |
| --- | --- | --- |
| assets barrel | `deno task check:assets-barrel` | PASS — CLI + plugin generated barrels diff clean |
| focused tests | `deno test --allow-read --allow-write packages/cli/src/public/features/plugins/scaffold/scaffold-plugin_test.ts` | PASS — 1 suite, 4 steps |
| focused check | `deno check --unstable-kv packages/plugin/src/templates/mod.ts packages/cli/src/public/features/plugins/scaffold/scaffold-plugin-use-case.ts packages/cli/src/public/features/plugins/scaffold/scaffold-plugin-command.ts packages/cli/src/public/features/root/public-command-dependencies.ts packages/cli/src/public/public-api.ts` | PASS |
| public help | `deno run -A packages/cli/bin/netscript.ts --help` | PASS — exit 0 |
| scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --root packages/plugin --root packages/fresh-ui --ext ts,tsx` | PASS — 710 files, 6 batches, 0 diagnostics |
| plugin doc-lint full export map | `deno doc --lint packages/plugin/mod.ts packages/plugin/src/abstracts/mod.ts packages/plugin/src/config/mod.ts packages/plugin/src/cli/mod.ts packages/plugin/loader.ts packages/plugin/src/sdk/mod.ts packages/plugin/src/testing/mod.ts packages/plugin/src/templates/mod.ts` | PASS — 8 files |
| scoped fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file <S2 files> --ext ts,tsx --ignore-line-endings --pretty` | PASS — 8 files, 0 findings |
| scoped lint | `deno lint --config /dev/null --rules-exclude=no-import-prefix,no-explicit-any <S2 files>` | PASS — 8 files |
| plugin publish dry-run | `cd packages/plugin && deno task publish:dry-run` | PASS — generated barrel and skeleton templates listed; existing slow-type/dynamic-import warnings remain |

### Notes

- Root/package lint still cannot be used as the S2 verdict for CLI files because `packages/cli` is
  excluded by the repo lint config. The raw scoped lint excludes `no-explicit-any` because the
  touched command file follows the existing Cliffy `Command<any,...>` baseline pattern.
- `deno.lock` was touched by validation and reverted; S2 has no intended lock churn.
- Branch push succeeded with `git push origin HEAD:refs/heads/fix/cli-jsr-asset-embedding`.
  GitHub API still returned no PR for the branch, so there was no PR comment target for S2.

## S3 — Fresh UI embedded registry

### Implementation

- Extended `.llm/tools/generate-cli-assets-barrel.ts` so `deno task gen:assets-barrel` also
  generates `packages/fresh-ui/registry.generated.ts`.
- Added `@netscript/fresh-ui/registry` as a public subpath exporting
  `freshUiRegistryManifest` and `FRESH_UI_REGISTRY_CONTENT`.
- Rewrote the CLI UI registry installer to use embedded fresh-ui manifest/content by default, while
  keeping `--registry-root` as the explicit filesystem override path.
- Removed the default `fromFileUrl(new URL('../../../../../fresh-ui/', import.meta.url))` registry
  root and added embedded-content test coverage.
- Reused the existing template renderer for `renderTemplateAssetSync`, preserving existing template
  pipes such as `camelCase` and `pascalCase`.

### Validation

| Gate | Command | Result |
| --- | --- | --- |
| assets barrel | `deno task check:assets-barrel` | PASS — CLI + plugin + fresh-ui generated barrels diff clean |
| focused tests | `deno test --allow-read --allow-write packages/cli/src/kernel/adapters/templates/template-asset_test.ts packages/cli/src/kernel/adapters/service/scaffolder_test.ts packages/cli/src/public/features/ui/registry.test.ts` | PASS — 18 tests |
| scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --root packages/plugin --root packages/fresh-ui --ext ts,tsx` | PASS — 712 files, 6 batches, 0 diagnostics |
| scoped fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root <S3 files> --ext ts,tsx` | PASS — 8 files, 0 findings |
| scoped lint | `deno lint --rules-exclude=no-import-prefix,no-explicit-any <S3 files>` | PASS |
| plugin doc-lint full export map | `deno doc --lint packages/plugin/mod.ts packages/plugin/src/abstracts/mod.ts packages/plugin/src/config/mod.ts packages/plugin/src/cli/mod.ts packages/plugin/loader.ts packages/plugin/src/sdk/mod.ts packages/plugin/src/testing/mod.ts packages/plugin/src/templates/mod.ts` | PASS — 8 files |
| fresh-ui registry doc-lint | `deno doc --lint packages/fresh-ui/registry.ts` | PASS — 1 file |
| fresh-ui full export-map doc-lint | `deno doc --lint packages/fresh-ui/mod.ts packages/fresh-ui/interactive.ts packages/fresh-ui/primitives.tsx packages/fresh-ui/registry.ts` | FAIL — 87 existing runtime public-surface doc/private-type findings; no registry findings |
| cli publish dry-run | `cd packages/cli && deno task publish:dry-run` | PASS — generated CLI assets listed; existing dynamic-import warnings remain |
| plugin publish dry-run | `cd packages/plugin && deno task publish:dry-run` | PASS — generated plugin assets listed; existing slow-type/dynamic-import warnings remain |
| fresh-ui publish dry-run | `cd packages/fresh-ui && deno publish --dry-run --allow-dirty` | PASS — `registry.generated.ts`, `registry.ts`, manifest, and registry files listed |
| scaffold runtime smoke | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | FAIL — first run exposed unrendered service template pipes, fixed in `template-asset.ts`; rerun reached clean scaffold init and all plugin gates, then failed `database.init` due external Aspire dashboard port `127.0.0.1:18891` already held by `/home/codex/repos/netscript-cli-plugin-copy/.llm/tmp/cli-e2e/plugin-smoke-20260626-101742/aspire/apphost.mts` |

### Notes

- The first runtime smoke run was useful evidence: scaffold init reported unrendered
  `{{serviceName | ...}}` placeholders in service files. `renderTemplateAssetSync` now delegates to
  the established `renderTemplate` helper, and the rerun's scaffold init stderr was clean.
- The remaining runtime smoke failure is an external Aspire lifecycle conflict, not an asset output
  difference. The conflicting process is outside this worktree, so it was not stopped from this
  implementation session.
- `deno.lock` was touched by validation/publish dry-runs and reverted; S3 has no intended lock
  churn.
