
## Runtime-launch contract — implementation dispatched 2026-06-30
- WSL Codex daemon thread: 019f16d5-1a01-7670-8de9-5771e9c3003f (worktree /home/codex/repos/netscript-scaffold-167, branch feat/scaffold-surface-167, model gpt-5.5, sandbox dangerFullAccess, approval never).
- Steer handle: codex exec resume 019f16d5-1a01-7670-8de9-5771e9c3003f - < file
- Brief: implement.md (Slices 0-6); plan.md/research.md committed (ce8ca012). Bar: scaffold.runtime failed=0 + arch:check 13-root green + publish dry-run clean per touched plugin.

## Baseline Reproduction

| Gate | Command | Exit | Evidence |
| --- | --- | ---: | --- |
| scaffold.runtime baseline | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | 1 | `Summary: passed=21 failed=1`; failing gate `runtime.wait.workers-api`. |

## Slice 0 — Sagas runtime declaration

| Gate | Command | Exit | Evidence |
| --- | --- | ---: | --- |
| sagas check | `cd plugins/sagas && deno task check` | 0 | Checked `mod.ts`, `cli.ts`, `scaffold.ts`, adapter/resources, public/CLI/E2E/Aspire/runtime/contracts/services/streams entrypoints. |
| sagas publish dry-run | `cd plugins/sagas && deno publish --dry-run --allow-dirty` | 0 | `Success Dry run complete`; existing unanalyzable dynamic-import warnings for service bootstrap and runtime importer. |

## Slice 1 — Workers runtime export

| Gate | Command | Exit | Evidence |
| --- | --- | ---: | --- |
| workers check | `cd plugins/workers && deno task check` | 0 | Checked new `bin/runtime.ts` export plus existing mod/CLI/scaffold/adapter/Aspire/contracts/services/streams/worker entrypoints. |
| workers publish dry-run | `cd plugins/workers && deno publish --dry-run --allow-dirty` | 0 | `Success Dry run complete`; existing unanalyzable dynamic-import warnings for `bin/combined.ts`, service bootstrap, and CLI local runtime backend. |

## Slice 2 — Triggers runtime processor export

| Gate | Command | Exit | Evidence |
| --- | --- | ---: | --- |
| triggers check | `cd plugins/triggers && deno task check` | 0 | Checked runtime export plus mod/CLI/scaffold/adapter/Aspire/public/services/streams entrypoints. |
| triggers publish dry-run | `cd plugins/triggers && deno publish --dry-run --allow-dirty` | 0 | `Success Dry run complete`; existing unanalyzable dynamic-import warnings for CLI local runtime backend and project trigger registry. |

## Slice 3 — Streams services export

| Gate | Command | Exit | Evidence |
| --- | --- | ---: | --- |
| streams check | `cd plugins/streams && deno task check` | 0 | Checked streams mod/scaffold/CLI/adapter/e2e/Aspire/verify/service entrypoints. |
| streams publish dry-run | `cd plugins/streams && deno publish --dry-run --allow-dirty` | 0 | `Success Dry run complete`; no publish warnings emitted. |

## Slice 4 — Install runtime glue

| Gate | Command | Exit | Evidence |
| --- | --- | ---: | --- |
| workers check | `cd plugins/workers && deno task check` | 0 | Checked workers runtime export plus adapter/resources with glue resource wired into install starters. |
| install test first run | `cd packages/cli && deno test --unstable-kv --allow-all src/public/features/plugins/install/install-plugin_test.ts` | 1 | Failed before glue assertions because local plugin fixture paths were cwd-relative under `packages/cli`; fixed test path anchoring to repo root. |
| install test rerun | `cd packages/cli && deno test --unstable-kv --allow-all src/public/features/plugins/install/install-plugin_test.ts` | 0 | `ok \| 1 passed (19 steps) \| 0 failed`; workers/sagas/triggers installs assert generated `runtime.ts` glue files. |

## Slice 5 — CLI launch contract generation

| Gate | Command | Exit | Evidence |
| --- | --- | ---: | --- |
| CLI tests first run | `cd packages/cli && deno test --unstable-kv --allow-all` | 1 | Failed on old contract assertions and cwd-relative test fixture paths exposed by running from `packages/cli`; fixed assertions/path anchors. |
| CLI tests rerun | `cd packages/cli && deno test --unstable-kv --allow-all` | 0 | `ok \| 177 passed (363 steps) \| 0 failed`. |
| root lint | `rtk proxy deno task lint` | 0 | `exitCode=0`; selected 1302 files, total lint occurrences 0. |

## Catalog correction — Shared npm package catalog dependency surface

| Gate | Command | Exit | Evidence |
| --- | --- | ---: | --- |
| auth check | `cd plugins/auth && deno task check` | 0 | Package resolves shared npm dependencies through `package.json` catalog entries. |
| sagas check | `cd plugins/sagas && deno task check` | 0 | Package resolves shared npm dependencies through `package.json` catalog entries. |
| streams check | `cd plugins/streams && deno task check` | 0 | Package resolves shared npm dependencies through `package.json` catalog entries. |
| triggers check | `cd plugins/triggers && deno task check` | 0 | Package resolves shared npm dependencies through `package.json` catalog entries. |
| workers check | `cd plugins/workers && deno task check` | 0 | Package resolves shared npm dependencies through `package.json` catalog entries. |
| catalog scan | `deno task deps:check:npm-catalog` | 0 | No warnings for `plugins/auth`, `plugins/sagas`, `plugins/streams`, `plugins/triggers`, or `plugins/workers`; remaining warnings are pre-existing outside this plugin correction. |
| auth publish dry-run | `cd plugins/auth && deno publish --dry-run --allow-dirty` | 0 | `Success Dry run complete`; existing unanalyzable dynamic-import warning for service bootstrap. |
| sagas publish dry-run | `cd plugins/sagas && deno publish --dry-run --allow-dirty` | 0 | `Success Dry run complete`; existing unanalyzable dynamic-import warnings for service bootstrap and runtime importer. |
| streams publish dry-run | `cd plugins/streams && deno publish --dry-run --allow-dirty` | 0 | `Success Dry run complete`; `package.json` included in publish file list. |
| triggers publish dry-run | `cd plugins/triggers && deno publish --dry-run --allow-dirty` | 0 | `Success Dry run complete`; existing unanalyzable dynamic-import warnings for CLI/runtime dynamic imports. |
| workers publish dry-run | `cd plugins/workers && deno publish --dry-run --allow-dirty` | 0 | `Success Dry run complete`; existing unanalyzable dynamic-import warnings for local combined wrapper, service bootstrap, and CLI local runtime backend. |

## Launch contract follow-up — Versioned JSR specifiers and local runtime imports

| Gate | Command | Exit | Evidence |
| --- | --- | ---: | --- |
| CLI tests | `cd packages/cli && deno test --unstable-kv --allow-all` | 0 | `ok \| 178 passed (363 steps) \| 0 failed`. |
| root lint | `rtk proxy deno task lint` | 0 | `exitCode=0`; selected 1302 files, total lint occurrences 0. |

## Final E2E follow-up — Seed typing and Aspire port cleanup

| Gate | Command | Exit | Evidence |
| --- | --- | ---: | --- |
| scaffold.runtime rerun | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | 1 | Generated workspace reached `database.seed` and `generated.deno-check`; failed at `runtime.aspire-start` because an overlapping AppHost from `plugin-smoke-20260630-074042` held `https://127.0.0.1:18891`. |
| Aspire cleanup | `aspire stop --apphost .llm/tmp/cli-e2e/plugin-smoke-20260630-074042/aspire/apphost.mts --non-interactive --nologo` | 0 | Stopped overlapping AppHost; `ss -ltnp` showed no remaining `1888*`/`4318` listeners afterward. |
| focused CLI regression tests | `cd packages/cli && deno test --unstable-kv --allow-all src/kernel/adapters/plugin/workspace-mutator_test.ts src/kernel/templates/database/generators_test.ts src/kernel/application/registries/template-registry_test.ts` | 0 | `ok \| 11 passed (7 steps) \| 0 failed`. |
