# Step 0 Enumeration Baseline

Command:

```sh
deno task test 2>&1 | tee .llm/tmp/run/test-suite-greenup--fix/enumeration-baseline.txt
```

Environment:

- Deno: 2.8.3
- Branch: chore/test-suite-green-up
- Date: 2026-06-17

Result line:

```text
FAILED | 473 passed (354 steps) | 11 failed (2 steps) | 12 ignored (27s)
```

Note: the exact brief command pipelines through `tee`, so the shell command returned the `tee`
status. The captured output is authoritative and shows the suite failed.

## Current Failure Set

| # | Test | File | Current category | Disposition plan |
|---|---|---|---|---|
| 1 | `loadRegisteredPlugins returns normalized background processor metadata` | `packages/cli/src/kernel/adapters/config/plugin-registry.test.ts:7` | missing test fixture | Rewrite test setup to use hermetic `netscript.config.ts` fixture. |
| 2 | `loadRegisteredPlugins loads plugin specs from netscript config when omitted` | `packages/cli/src/kernel/adapters/config/plugin-registry.test.ts:37` | missing test fixture | Same fixture rewrite. |
| 3 | `loadRegisteredPlugins preserves registry output shape from explicit config specs` | `packages/cli/src/kernel/adapters/config/plugin-registry.test.ts:49` | missing test fixture | Same fixture rewrite. |
| 4 | `extractCompileTargets enriches targets from plugin registry metadata` | `packages/cli/src/kernel/adapters/windows/compile/compile.test.ts:7` | missing test fixture | Rewrite compile fixture to load temp config instead of repo root. |
| 5 | `loadDeployConfig resolves unified background processors from appsettings and registry` | `packages/cli/src/kernel/adapters/windows/compile/compile_test.ts:35` | missing/stale fixture | Rewrite config/appsettings fixture locally. |
| 6 | `extractCompileTargets emits metadata-driven background processor targets` | `packages/cli/src/kernel/adapters/windows/compile/compile_test.ts:63` | missing/stale fixture | Same compile fixture rewrite. |
| 7 | `copyOfficialPlugin wires sample config and runtime files for scaffold projects` | `packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-samples_test.ts:11` | stale fixture/doc drift | Update fixture expectations or sample content after inspection. |
| 8 | `public generate application flows ... plans runtime config schema writes with configured paths` | `packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas_test.ts:48` | platform path bug | Fix Windows absolute path handling. |
| 9 | `public generate application flows ... writes changed schemas and skips unchanged files` | `packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas_test.ts:85` | platform path bug | Same path fix. |
| 10 | `discoverWorkspace finds standardized project members` | `packages/config/workspace.test.ts:6` | real parser bug | Use JSONC parser for `deno.json` files. |
| 11 | `DenoRuntimeAdapter executes a script and captures output` | `packages/plugin-workers-core/tests/executor/deno-runtime-adapter_test.ts:5` | newly surfaced fixture/environment bug | Inspect adapter/test; likely script path or subprocess invocation drift. |
| 12 | `DenoRuntimeAdapter captures a non-zero exit` | `packages/plugin-workers-core/tests/executor/deno-runtime-adapter_test.ts:25` | newly surfaced fixture/environment bug | Same root cause as #11. |

Counting note: Deno reports 11 failed tests and 2 failed BDD steps. This failure table has 12 rows
because the runtime-schema BDD test contributes two failed steps.

## Changes From Inventory

- `packages/queue/tests/memory-queue_test.ts` no longer fails under Deno 2.8.3.
- `packages/plugin-workers-core/tests/executor/deno-runtime-adapter_test.ts` now runs and contributes
  two failures.
- The baseline still ends with an unsupported `catalog:` diagnostic after the failure summary. Since
  the full suite reaches the normal Deno summary first, this is tracked as validation output drift
  until the functional failures are resolved.
