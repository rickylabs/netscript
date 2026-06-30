# #172b/c/d Adapter Relocation Worklog

## Pre-flight

- Branch check: `git rev-parse --abbrev-ref HEAD` -> `feat/scaffold-surface-167`.
- Head check: `git log --oneline -1` -> `c87331f9 docs(harness): #182 record PLAN-EVAL cycle-2 verdict PASS -- gate cleared`.
- Defensive unset: `GIT_DIR`, `GIT_WORK_TREE`, and `GIT_INDEX_FILE` unset before implementation commands.
- Known drift left untouched: `.llm/tmp/run/openhands/pr-*/request.md` files show modified; not staged.
- Additional local artifact: `implement.md` exists as an untracked run brief in this worktree; left unstaged.

## Slice Evidence

### S-b — sagas

- Relocated `KvSagaStore`, `KvSagaAppliedKeyStore`, `KvSagaIdempotencyStore`, `PrismaSagaStore`, and `resolveSagaStoreBackend` into `packages/plugin-sagas-core/src/stores/`.
- Migrated sagas KV stores to injected `@netscript/kv` `KvStore` handles with atomic compare-and-swap through `KvStore.atomic`; production store code has no `Deno.openKv` / raw `Deno.Kv` handle.
- Rewired sagas connector/service/supervisor composition roots to import concrete stores from `@netscript/plugin-sagas-core/stores`; connector `./runtime` now keeps publisher/runner/supervisor/runtime factory only.
- S-b.5 import-clause grep for relocated symbols from `@netscript/plugin-sagas/runtime`: exit 0, zero matches.
- Lock delta: `deno.lock` gained the expected `jsr:@netscript/kv@0.0.1-alpha.12` dependency under `@netscript/plugin-sagas-core`; no hand edit.

Gate evidence:

| Gate | Result |
| --- | --- |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-sagas-core --ext ts,tsx` | exit 0; 104 files; 0 occurrences |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/sagas --ext ts,tsx` | exit 0; 63 files; 0 occurrences |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-sagas-core --ext ts,tsx` | exit 0; 104 files; 0 occurrences |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/sagas --ext ts,tsx` | exit 0; 63 files; 0 occurrences |
| explicit-file `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts ... --ext ts,tsx` over S-b touched files | exit 0; 16 files; 0 findings |
| `deno test --unstable-kv --allow-all packages/plugin-sagas-core plugins/sagas` | exit 0; 75 passed; 0 failed |
| `(cd packages/plugin-sagas-core && deno publish --dry-run --allow-dirty)` | exit 0; no slow-type failure |
| `(cd plugins/sagas && deno publish --dry-run --allow-dirty)` | exit 0; warning-only existing unanalyzable dynamic imports |
| `deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/plugin-sagas-core` | exit 0; `FAIL=0` |
| `deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root plugins/sagas` | exit 0; `FAIL=0` |
| `rtk proxy deno task arch:check` | exit 1; fails before touched roots on pre-existing `packages/plugin-auth-core` `FAIL=12` findings; recorded in `drift.md` |

### S-c — triggers

- Relocated `KvTriggerEventStore`, `KvTriggerIdempotencyStore`, and `KvTriggerDlqStore` into `packages/plugin-triggers-core/src/stores/`.
- Relocated `CronTriggerSchedulerAdapter` and `WatchersFileWatcherAdapter` into `packages/plugin-triggers-core/src/adapters/`.
- Migrated production trigger KV stores to injected `@netscript/kv` `KvStore` handles with atomic writes through `KvStore.atomic`; production store/runtime code has no `Deno.openKv` / raw `Deno.Kv` handle or `as Deno.Kv` cast.
- S-c.5 fixture rename: chose `DenoKvTriggerEventStoreDouble` because `MemoryTriggerEventStore` was already taken. Grep for the old testing fixture path/name in `packages/plugin-triggers-core/src/testing` found no `kv-trigger-event-store` file/export or `class KvTriggerEventStore`; only the new `DenoKvTriggerEventStoreDouble` export remains.
- Dependency checks: `deno task deps:why @netscript/kv`, `@netscript/cron`, and `@netscript/watchers` exit 0 and show the new `packages/plugin-triggers-core` source hits.
- Lock delta: `deno.lock` gained the expected `jsr:@netscript/kv@0.0.1-alpha.12`, `jsr:@netscript/cron@0.0.1-alpha.12`, and `jsr:@netscript/watchers@0.0.1-alpha.12` dependency entries under `@netscript/plugin-triggers-core`; no hand edit.

Gate evidence:

| Gate | Result |
| --- | --- |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-triggers-core --ext ts,tsx` | exit 0; 60 files; 0 occurrences |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/triggers --ext ts,tsx` | exit 0; 62 files; 0 occurrences |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-triggers-core --ext ts,tsx` | exit 0; 60 files; 0 occurrences |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/triggers --ext ts,tsx` | exit 0; 62 files; 0 occurrences |
| explicit-file `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts ... --ext ts,tsx,json` over S-c touched files | exit 0; 14 files; 0 findings |
| `deno test --unstable-kv --allow-all packages/plugin-triggers-core plugins/triggers` | exit 0; 32 passed, 12 ignored, 0 failed |
| `(cd packages/plugin-triggers-core && deno publish --dry-run --allow-dirty --allow-slow-types)` | exit 0; existing slow-types warning allowed |
| `(cd plugins/triggers && deno publish --dry-run --allow-dirty)` | exit 0; warning-only existing unanalyzable dynamic imports |
| `deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/plugin-triggers-core` | exit 0; `FAIL=0` |
| `deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root plugins/triggers` | exit 0; `FAIL=0` |
| `rtk proxy deno task arch:check` | exit 1; same pre-existing `packages/plugin-auth-core` `FAIL=12` findings before touched roots; recorded in `drift.md` |

### S-d — workers

- Relocated `KvWorkerIdempotencyStore` into `packages/plugin-workers-core/src/stores/`.
- Added `@netscript/plugin-workers-core/stores` and rewired workers service/test imports to the core store subpath.
- Removed the connector `worker/mod.ts` re-export for the relocated store.
- The store was already on the `@netscript/kv` structural-port pattern; no raw KV migration was needed.
- Lock delta: `deno.lock` gained the expected `jsr:@netscript/kv@0.0.1-alpha.12` dependency entry under `@netscript/plugin-workers-core`; no hand edit.

Gate evidence:

| Gate | Result |
| --- | --- |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-workers-core --ext ts,tsx` | exit 0; 110 files; 0 occurrences |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/workers --ext ts,tsx` | exit 0; 83 files; 0 occurrences |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-workers-core --ext ts,tsx` | exit 0; 110 files; 0 occurrences |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/workers --ext ts,tsx` | exit 0; 83 files; 0 occurrences |
| explicit-file `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts ... --ext ts,tsx,json` over S-d touched files | exit 0; 8 files; 0 findings |
| `deno test --unstable-kv --allow-all packages/plugin-workers-core plugins/workers` | exit 0; 45 passed; 0 failed |
| `(cd packages/plugin-workers-core && deno publish --dry-run --allow-dirty)` | exit 0; warning-only existing unanalyzable dynamic import |
| `(cd plugins/workers && deno publish --dry-run --allow-dirty)` | exit 0; warning-only existing unanalyzable dynamic imports |
| `deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/plugin-workers-core` | exit 0; `FAIL=0` |
| `deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root plugins/workers` | exit 0; `FAIL=0` |
| `rtk proxy deno task arch:check` | exit 1; same pre-existing `packages/plugin-auth-core` `FAIL=12` findings before touched roots; recorded in `drift.md` |
