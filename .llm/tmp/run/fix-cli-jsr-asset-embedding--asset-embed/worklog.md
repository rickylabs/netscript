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
