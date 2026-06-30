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
