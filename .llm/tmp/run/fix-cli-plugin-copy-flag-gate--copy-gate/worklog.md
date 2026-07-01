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

## S3 — e2e confirmation and debt close

### Changes

- Added and immediately closed `PLUGIN-USERLAND-SOURCE-COPY` in `.llm/harness/debt/arch-debt.md`.
- Preserved the default maintainer e2e shape: local official plugin add still copies first-party
  plugin source unless `--no-copy-source` is passed.

### Validation

| Gate | Command | Result |
| ---- | ------- | ------ |
| native worktree check | `pwd && df -T .` | `/home/codex/repos/netscript-cli-plugin-copy`, filesystem `ext4` |
| e2e plugins | `rtk proxy deno task e2e:cli run scaffold.plugins --cleanup --format pretty` | pass; summary `passed=11 failed=0` |
| e2e runtime first attempt | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | failed one gate: `behavior.workers-executions`; summary `passed=34 failed=1`; cleanup passed |
| e2e runtime parallel-mode check | `aspire start --help`; `deno task e2e:cli run --help`; process/port inspection | confirmed the CLI e2e runner already launches Aspire with `--isolated`; a concurrent scaffold runtime run can still contend on Aspire's control-plane port `18891` |
| e2e runtime raw rerun | `deno task e2e:cli run scaffold.runtime --name plugin-copy-flag-runtime-20260626103409-raw --cleanup --format pretty --report .llm/tmp/run/fix-cli-plugin-copy-flag-gate--copy-gate/scaffold-runtime-raw-report.json --log-file .llm/tmp/run/fix-cli-plugin-copy-flag-gate--copy-gate/scaffold-runtime-raw.ndjson` after the parallel AppHost released `18891` | pass; summary `passed=47 failed=0` |

First runtime attempt failure detail: the workers health/job/task/trigger endpoints passed, then
`behavior.workers-executions` received `Connection refused` from `http://localhost:8091` and cleanup
reported no AppHost was running. Nearby Aspire logs showed apphost instability/port conflict noise
from generated runs.

User follow-up noted a likely parallel `aspire stop` / Aspire interaction and asked to check CLI
docs for parallel launch mode. The Aspire and CLI help confirmed the e2e path already uses
`aspire start --isolated`; the observed remaining collision was Aspire's control-plane port
`18891` while another scaffold runtime suite was active. After that run released the port, a raw
rerun from the same WSL ext4 worktree passed all runtime gates.

## S4 — public copy opt-out gate after main merge

### Changes

- Gated the public official-plugin copy path on `plan.noCopySource === true` before probing
  `canCopyPlugin`.
- Exposed public `plugin add --no-copy-source` and mapped Cliffy `copySource === false` to the
  existing `PluginAddRequest.noCopySource` field.
- Replaced the stale static maintainer-import guard with a behavioral public add test that wires
  copy-capable dependencies, passes `noCopySource: true`, and asserts the canonical JSR stub is
  rendered without adding the copied background workspace.

### Validation

| Gate | Command | Result |
| ---- | ------- | ------ |
| public add unit | `deno test --allow-all packages/cli/src/public/features/plugins/add/add-plugin_test.ts` | pass; `ok \| 1 passed (5 steps) \| 0 failed (34ms)` |
| local add regression | `deno test --allow-all packages/cli/src/local/features/plugins/add/add-local-plugin_test.ts` | pass; `ok \| 1 passed (4 steps) \| 0 failed (35ms)` |
| version drift guard | `deno test --allow-all packages/cli/src/kernel/constants/version-drift_test.ts` | pass; `ok \| 1 passed \| 0 failed (106ms)` |
| scoped CLI check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | pass; `summary.totalOccurrences=0`, `failedBatches=0` |
| repo test | `rtk proxy deno task test` | pass; `ok \| 892 passed (373 steps) \| 0 failed \| 12 ignored (37s)` |
| scaffold runtime | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | pass; raw exit code 0; `Summary: passed=47 failed=0` |
