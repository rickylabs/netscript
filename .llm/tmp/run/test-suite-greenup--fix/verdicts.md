# Verdicts

| File:line | Category | Root cause | Action | Rationale | Commit |
|---|---|---|---|---|---|
| `packages/cli/src/kernel/adapters/config/plugin-registry.test.ts:7` | missing test fixture | Test depends on repo-root `netscript.config.ts` that is absent. | Pending | Test protects plugin registry metadata normalization; keep and make hermetic. | Pending |
| `packages/cli/src/kernel/adapters/config/plugin-registry.test.ts:37` | missing test fixture | Omitted-config path still needs discoverable fixture config. | Pending | Test protects fallback loading from config. | Pending |
| `packages/cli/src/kernel/adapters/config/plugin-registry.test.ts:49` | missing test fixture | Explicit config specs are loaded from missing root config. | Pending | Test protects registry output shape. | Pending |
| `packages/cli/src/kernel/adapters/windows/compile/compile.test.ts:7` | missing test fixture | Compile target extraction loads missing repo-root config. | Pending | Test protects plugin metadata to compile target mapping. | Pending |
| `packages/cli/src/kernel/adapters/windows/compile/compile_test.ts:35` | missing/stale fixture | Test combines missing config with absent `dotnet/AppHost/appsettings.json`. | Pending | Test protects unified background processor config; rewrite fixture locally. | Pending |
| `packages/cli/src/kernel/adapters/windows/compile/compile_test.ts:63` | missing/stale fixture | Shared config fixture rejects before target extraction. | Pending | Test protects metadata-driven background processor targets. | Pending |
| `packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-samples_test.ts:11` | stale fixture/doc drift | Sample fixture expectations diverge from copied official plugin content. | Pending | Test protects official plugin sample copy behavior; inspect before changing. | Pending |
| `packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas_test.ts:48` | platform bug | POSIX `resolve()` treats `C:/...` as relative and prefixes cwd. | Pending | Test intentionally guards cross-platform Windows absolute path behavior. | Pending |
| `packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas_test.ts:85` | platform bug | Same path mismatch prevents unchanged-file skip detection. | Pending | Same valuable behavior as above. | Pending |
| `packages/config/workspace.test.ts:6` | real parser bug | `workspace.ts` used strict `JSON.parse` for JSONC `deno.json`. | Fixed with `@std/jsonc` in workspace discovery. | Deno config files are JSONC; product code now uses the platform-standard parser instead of a local comment stripper. | Pending sha |
| `packages/plugin-workers-core/tests/executor/deno-runtime-adapter_test.ts:5` | newly surfaced failure | Current Deno/runtime adapter invocation mismatch after catalog files now run. | Pending | Test protects subprocess execution contract. | Pending |
| `packages/plugin-workers-core/tests/executor/deno-runtime-adapter_test.ts:25` | newly surfaced failure | Same adapter/test root cause. | Pending | Test protects non-zero exit capture. | Pending |
