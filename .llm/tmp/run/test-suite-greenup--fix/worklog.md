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
