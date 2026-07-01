# Worklog

## Design

This is a test-suite green-up implementation slice for package-quality PR 46. Public API changes are
not planned except where a failing test exposes a real product bug. The current failing surfaces are:

- `@netscript/config` workspace discovery, archetype 1: parse workspace `deno.json` as JSONC.
- `@netscript/cli`, archetype 6: keep fixture fixes hermetic and avoid adding root-level config
  assumptions.
- `@netscript/plugin-workers-core`, runtime adapter tests: preserve the runtime adapter contract
  while making the tests valid under the current Deno toolchain.

Commit slices:

1. `jsonc-parser`: fix `packages/config/workspace.ts` and prove `packages/config/workspace.test.ts`.
2. `platform-paths`: fix runtime schema path planning and prove its BDD test.
3. `worker-runtime-adapter`: fix newly surfaced plugin-workers-core Deno runtime adapter failures.
4. `cli-config-fixtures`: rewrite plugin registry and compile tests around temp config fixtures.
5. `official-plugin-samples`: repair stale official-plugin sample fixture assertions.
6. `final-gate`: run full `deno task test`, update verdicts/context, final PR comment.

Deferred scope: no JSR publish, no branch rebasing or merge from main, no repo-wide formatting.

## Step 0 Enumeration

- Ran the exact brief command:
  `deno task test 2>&1 | tee .llm/tmp/run/test-suite-greenup--fix/enumeration-baseline.txt`
- Captured result:
  `FAILED | 473 passed (354 steps) | 11 failed (2 steps) | 12 ignored (27s)`
- Drift from inventory:
  queue timer tests pass under Deno 2.8.3; two plugin-workers-core runtime adapter tests now fail.

## Slice 1 — jsonc-parser

- Root cause: `packages/config/workspace.ts` parsed `deno.json` files with strict `JSON.parse`.
- Change: switched workspace discovery to `@std/jsonc` and declared the package-local import.
- Lock hygiene: `deno.lock` changed by one additive `@std/jsonc` package reference.
- Proof: `deno test --allow-all packages/config/workspace.test.ts`
  -> `ok | 1 passed | 0 failed (44ms)`.
- Failure-count delta: current full-suite baseline 11 failed -> expected 10 failed.

## Slice 2 — platform-paths

- Root cause: `planConfigSchemaWrites` called POSIX `resolve()` for Windows-style project roots,
  causing `C:/workspace/...` to be treated as relative under Linux.
- Change: added a local project-path resolver that preserves Windows absolute roots and configured
  Windows absolute schema paths while retaining `@std/path.resolve` for native paths.
- Proof:
  `deno test --allow-all packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas_test.ts`
  -> `ok | 1 passed (4 steps) | 0 failed (21ms)`.
- Failure-count delta: expected 10 failed -> expected 9 failed, with both BDD step failures fixed.

## Slice 3 — worker-runtime-adapter

- Root cause: the newly surfaced adapter tests inherited a host `DENO_EXECUTABLE` pointing at
  `/root/.dotnet/tools/deno`, so subprocess execution failed before exercising adapter behavior.
- Change: made the tests pin `DENO_EXECUTABLE` to `Deno.execPath()` for the duration of each real
  subprocess assertion, then restore the original environment.
- Proof:
  `deno test --allow-all packages/plugin-workers-core/tests/executor/deno-runtime-adapter_test.ts`
  -> `ok | 2 passed | 0 failed (76ms)`.
- Failure-count delta: expected 9 failed -> expected 7 failed.

## Slice 4 — cli-config-fixtures

- Root cause: plugin registry and Windows compile tests loaded config from the repository root, but
  this branch no longer carries a root `netscript.config.ts` or `dotnet/AppHost/appsettings.json`.
- Change: rewrote the affected tests to create hermetic temp project fixtures with minimal
  `netscript.config.ts` and, for compile tests, local `dotnet/AppHost/appsettings.json`.
- Proof:
  `deno test --allow-all packages/cli/src/kernel/adapters/config/plugin-registry.test.ts packages/cli/src/kernel/adapters/windows/compile/compile.test.ts packages/cli/src/kernel/adapters/windows/compile/compile_test.ts`
  -> `ok | 6 passed | 0 failed (1s)`.
- Failure-count delta: expected 7 failed -> expected 1 failed.

## Slice 5 — official-plugin-samples

- Root cause: the sample-copy test expected older standalone `defineJob(...)` output, while the
  current registry generator emits worker job IDs inside `defineWorkers({ groups: ... })`.
- Change: updated the stale assertions to check for the generated worker job IDs in the current
  config shape, while preserving saga, trigger, and runtime JSON assertions.
- Proof:
  `deno test --allow-all packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-samples_test.ts`
  -> `ok | 2 passed | 0 failed (221ms)`.
- Failure-count delta: expected 1 failed -> expected 0 failed.

## Slice 6 — catalog-resolution

- Root cause: after all test assertions were green, `deno task test` still exited 1 because multiple
  workspace member import maps contained bare `catalog:` values that Deno reported as an unsupported
  scheme at graph resolution time.
- Rejected change: `103f9a8` materialized package/plugin member `catalog:` imports to explicit
  per-member `npm:` specifiers. Maintainer rejected that as the wrong model.
- Rejected change: `9262399` removed the member `catalog:` import-map entries and centralized the
  catalog dependencies in root `deno.json` `imports`. Maintainer rejected this too: root imports
  must return to `{}` and all 67 member `catalog:` refs must remain intact.
- Representative proofs:
  - `deno test --allow-all packages/contracts/tests/contracts_test.ts`
    -> `ok | 2 passed | 0 failed (28ms)`.
  - `deno test --allow-all packages/service/tests/handlers_test.ts`
    -> `ok | 2 passed | 0 failed (32ms)`.
  - `deno test --allow-all packages/fresh-ui/tests/consumer-render.test.tsx`
    -> `ok | 1 passed | 0 failed (30ms)`.
  - `deno test --allow-all packages/plugin-workers-core/tests/streams/workers-streams_test.ts`
    -> `ok | 3 passed | 0 failed (19ms)`.

## Final Gate

- Command: `set -o pipefail; deno task test 2>&1 | tee .llm/tmp/run/test-suite-greenup--fix/final-test-after-catalog-rework.txt`
- Captured in: `.llm/tmp/run/test-suite-greenup--fix/final-test-after-catalog-rework.txt`
- Result: `ok | 643 passed (356 steps) | 0 failed | 12 ignored (29s)`
- Exit code: 0

## Supervisor Correction — catalog restoration

- Directive read: `.llm/tmp/run/test-suite-greenup--fix/SUPERVISOR-CORRECTION.md`.
- Required restoration: root `deno.json` `imports` restored to `{}`, all 67 member `catalog:` refs
  restored across 18 member `deno.json` files, root `catalog` block retained, and `deno.lock`
  restored away from the rejected de-catalog resolution churn.
- Verification before commit:
  - `git diff 733388f -- '**/deno.json' 'deno.json' | grep -E '^[-+].*catalog:' ; echo exit=$?`
    -> `exit=1`.
  - `git grep -c 'catalog:' -- '**/deno.json' | awk -F: '{s+=$NF} END{print s" refs across "NR" files"}'`
    -> `67 refs across 18 files`.
  - root `deno.json` imports -> `{}`; root catalog entries -> `33`.
- Commit: `20d6b03 revert de-catalog; restore 67 catalog: refs + root imports {}; maintainer directive`.
- Push: `git push origin chore/test-suite-green-up` succeeded (`30ed34b..20d6b03`).

## Catalog-preserving retry

- Environment confirmation:
  - cwd: `/home/codex/repos/netscript-test-green-up`.
  - `command -v deno`: `/usr/local/bin/deno`.
  - `deno --version`: `deno 2.8.3 (stable, release, x86_64-unknown-linux-gnu)`,
    V8 `14.9.207.2-rusty`, TypeScript `6.0.3`.
  - `Deno.execPath()`: `/home/codex/.deno/bin/deno`.
- Workspace/catalog checks:
  - root workspace uses globs `packages/*`, `packages/cli/e2e`, `plugins/*`, `examples/*`,
    `apps/*`; these include the member package/plugin directories with catalog refs.
  - catalog completeness check found `18` catalog-ref files and no missing root catalog keys.
  - `deno install` exited `0`; lock movement was only the additive `@std/jsonc` entry for
    `packages/config`.
- First restored-catalog test run:
  - Command: `set -o pipefail; deno task test 2>&1 | tee .llm/tmp/run/test-suite-greenup--fix/final-test-after-catalog-restore.txt`.
  - Exit code: `1`.
  - Initial blocker: `packages/config/workspace.ts` imports `@std/jsonc`, but restoring
    `packages/config/deno.json` to base removed the package-local `@std/jsonc` import declaration.
- Catalog-preserving fix:
  - Added `@std/jsonc: jsr:@std/jsonc@^1` back to `packages/config/deno.json`.
  - Focused proof: `deno test --allow-all packages/config/workspace.test.ts`
    -> `ok | 1 passed | 0 failed (65ms)`.
- Final restored-catalog test attempt:
  - Command: `set -o pipefail; deno task test 2>&1 | tee .llm/tmp/run/test-suite-greenup--fix/final-test-catalog-preserved.txt`.
  - Exit code: `1`.
  - Test assertions summary: `ok | 484 passed (356 steps) | 0 failed | 12 ignored (46s)`.
  - Process blocker after summary:
    `error: Unsupported scheme "catalog" for module "catalog:" ... at packages/contracts/src/application/contract-primitives.ts:1:20`.
- Narrow reproduction:
  - `deno test --allow-all packages/contracts/src/application/contract-primitives.ts`
    -> `ok | 0 passed | 0 failed`, then the same `Unsupported scheme "catalog"` error.
  - `deno check packages/contracts/src/application/contract-primitives.ts` -> exit `0`.
  - `deno run --allow-all packages/contracts/src/application/contract-primitives.ts`
    -> same `Unsupported scheme "catalog"` error.
- Hard-stop status: unable to make `deno task test` exit `0` while leaving the restored member
  `catalog:` import-map entries intact. Catalog remains intact.
