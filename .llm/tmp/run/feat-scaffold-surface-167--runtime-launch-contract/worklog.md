
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
| scaffold.runtime rerun | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | 1 | Runtime launch gates passed through `runtime.wait.triggers` and `runtime.aspire-describe`; failed later at `behavior.workers-health` with a 30s aborted GET to `http://127.0.0.1:8091/health/live`. |
| bootstrap import-map fix tests | `cd packages/cli && deno test --unstable-kv --allow-all src/kernel/templates/plugins/generate-plugin-service_test.ts src/kernel/application/registries/template-registry_test.ts src/kernel/adapters/plugin/workspace-mutator_test.ts` | 0 | `ok \| 13 passed \| 0 failed`; service-context bootstrap now keeps bare `@netscript/*` imports so generated import maps control local-source/JSR resolution. |

## Finalization — triggers webhook and runtime evidence

| Gate | Command | Exit | Evidence |
| --- | --- | ---: | --- |
| source-root marker unit tests | `deno test --unstable-kv --allow-all packages/cli/src/maintainer/adapters/packages-copier_test.ts packages/cli/src/maintainer/adapters/official-plugin-source_test.ts` | 0 | `ok \| 3 passed \| 0 failed`. |
| focused triggers/generator tests | `deno test --unstable-kv --allow-all plugins/triggers/src/adapter/resources/resources.test.ts plugins/triggers/services/src/main_test.ts plugins/triggers/src/runtime/project-trigger-registry_test.ts` plus Aspire helper generator tests | 0 | Trigger service registry fallback, legacy events alias, starter webhook enqueue action, and generated Aspire registry env assertions passed. |
| scaffold.runtime final | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | 0 | `Summary: passed=48 failed=0`; `behavior.triggers-webhook`, `behavior.triggers-events`, and `behavior.otel.traces` passed. |
| arch check | `deno task arch:check` | 0 | All 13 doctrine roots reported `FAIL=0`; existing warnings only. |
| CLI publish dry-run | `cd packages/cli && deno publish --dry-run --allow-dirty` | 0 | `Success Dry run complete`; existing unanalyzable dynamic-import warnings in CLI plugin registry/UI registry. |
| triggers publish dry-run | `cd plugins/triggers && deno publish --dry-run --allow-dirty` | 0 | `Success Dry run complete`; existing unanalyzable dynamic-import warnings in local runtime backend and project trigger registry. |

## Check-test finalization — repo-wide merge gate

| Gate | Command | Exit | Evidence |
| --- | --- | ---: | --- |
| focused check-test regressions | `deno test --unstable-kv --allow-all packages/cli/src/kernel/templates/aspire/helpers/tests/generators-service-plugin_test.ts packages/cli/src/public/features/plugins/install/install-plugin_test.ts plugins/auth/tests/scaffold/manifest_test.ts packages/cli/src/kernel/constants/version-drift_test.ts` | 0 | `ok \| 6 passed (44 steps) \| 0 failed`; pinned trigger fixture, workers appsettings service entry, auth manifest, and version-drift guard all passed. |
| saga KV isolation focused tests | `deno test --unstable-kv --allow-all plugins/sagas/src/runtime/saga-supervisor_test.ts packages/plugin-sagas-core/src/stores/kv-saga-store_test.ts` | 0 | `ok \| 8 passed \| 0 failed`; `NETSCRIPT_SAGA_KV_PATH` now opens the requested Deno KV path and the supervisor fixture resets shared KV state. |
| repo check | `deno task check` | 0 | `failedBatches=0`; selected 1847 files across 16 batches. |
| repo test | `deno task test` | 0 | `ok \| 1017 passed (431 steps) \| 0 failed \| 12 ignored`. |
