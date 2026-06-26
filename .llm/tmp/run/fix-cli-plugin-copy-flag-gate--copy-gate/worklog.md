# Worklog — fix-cli-plugin-copy-flag-gate--copy-gate

## Design

### Public Surface

- Public `netscript plugin add` remains unchanged and hardcoded to JSR import mode.
- Local `netscript-dev plugin add` gains a maintainer-only `--no-copy-source` flag.
- No `@netscript/cli` published exports are changed.

### Domain Vocabulary

- `noCopySource`: local plugin-add request intent that disables official source copying.
- Thin local stub: `PluginScaffolder.scaffold()` output with `importMode: 'local'`.
- Vendored official copy: existing `copyOfficialPlugin()` path for canonical first-party plugins.

### Ports

- Existing `FileSystemPort`, `ScaffolderPort`, `TemplatePort`, and workspace mutator ports only.
- No new external adapter or port is introduced.

### Constants

- Flag: `--no-copy-source`.
- Run debt: `PLUGIN-USERLAND-SOURCE-COPY`.

### Commit Slices

- S1: local flag plumbing and gate; prove with scoped package check, focused lint/fmt, and
  plugin-add unit tests.
- S2: public prod no-copy regression lock; prove with public/local plugin-add units and
  `publish:dry-run`.
- S3: e2e/runtime confirmation and debt close; prove with `scaffold.plugins` and
  `scaffold.runtime`.

### Deferred Scope

- Default-off maintainer copy plus replacement runtime reader/scaffold path is deferred as a
  separate program.
- Asset-read import-attribute work from #124 is out of scope.

### Contributor Path

- Contributors use `netscript-dev plugin add <kind> --name <canonical>` for the current full
  first-party vendored source copy.
- Contributors use `--no-copy-source` when they only need a thin local-import plugin stub.

## S1 — local no-copy-source flag plumbing

### Changes

- Added local command flag `--no-copy-source` after `--no-samples`.
- Threaded Cliffy `copySource === false` into `noCopySource: true`.
- Added `PluginAddRequest.noCopySource` as internal request plumbing.
- Gated `maybeCopyOfficialPlugin()` before `canCopyPlugin()` / `copyPlugin()`.
- Split local add tests so canonical default copy remains preserved and canonical `noCopySource`
  generates a thin local-import stub without invoking copy helpers.

### Validation

| Gate | Command | Result |
| ---- | ------- | ------ |
| local unit | `deno test --allow-all packages/cli/src/local/features/plugins/add/add-local-plugin_test.ts` | pass; 1 suite, 4 steps |
| scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx --pretty` | pass; 518 files, 5 batches, 0 findings |
| scoped lint wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx --pretty` | nonzero with 0 findings; root lint config excludes `packages/cli/` |
| scoped fmt wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx --pretty` | nonzero with 0 findings; root fmt config excludes `packages/cli/` |
| focused lint | `deno lint --no-config --rules-exclude=no-explicit-any <S1 files>` | pass; excludes existing `Command<any,...>` pattern only |
| focused fmt | `deno fmt --no-config --single-quote --line-width 100 --check <S1 files>` | pass; checked 5 files |
| plugin-add units | `deno test --allow-all packages/cli/src/local/features/plugins/add/add-local-plugin_test.ts packages/cli/src/public/features/plugins/add/add-plugin_test.ts` | pass; 2 suites, 6 steps |

Invalid attempt: `run-deno-check.ts --root packages/cli --ext ts,tsx -- --unstable-kv` failed by
trying to spawn `--unstable-kv`; rerun correctly because the wrapper passes `--unstable-kv` by
default.

## S2 — public prod no-copy regression lock

### Changes

- Added a public canonical `worker`/`workers` plugin-add regression.
- Asserted public output remains the JSR stub shape: `@netscript/plugin` resolves to JSR and
  generated `mod.ts` imports `definePlugin`.
- Asserted official source-only files are absent from `plugins/workers/`, including
  `src/public/mod.ts`, `worker/worker.ts`, and `scaffold.plugin.json`.
- Asserted public plugin-add feature files do not reference `copyOfficialPlugin`, direct
  `copyPlugin(...)`, or `maintainer-api`.

### Validation

| Gate | Command | Result |
| ---- | ------- | ------ |
| plugin-add units | `deno test --allow-all packages/cli/src/public/features/plugins/add/add-plugin_test.ts packages/cli/src/local/features/plugins/add/add-local-plugin_test.ts` | pass; 2 suites, 8 steps |
| publish dry-run | `deno task publish:dry-run` from `packages/cli` | pass; existing dynamic-import warnings in `plugin-registry.ts` and UI registry, dry run complete |
| focused lint | `deno lint --no-config --rules-exclude=no-explicit-any packages/cli/src/public/features/plugins/add/add-plugin_test.ts` | pass |
| focused fmt | `deno fmt --no-config --single-quote --line-width 100 --check packages/cli/src/public/features/plugins/add/add-plugin_test.ts` | pass |
