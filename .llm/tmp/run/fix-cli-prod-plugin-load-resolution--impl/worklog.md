# Worklog

## Design

- Public surface: `netscript plugin add`, `netscript plugin list`, and `netscript plugin doctor`.
- Domain vocabulary: plugin kind, root import map, scaffold plugin metadata, registered plugin metadata.
- Ports: existing filesystem/config ports only; no new external adapter.
- Constants: plugin-kind to root import-map specifier table.
- Commit slices: Fix B root import-map completion; Fix A metadata-only list/doctor resolution.
- Deferred scope: release/version bump and IMPL-EVAL remain with the supervisor/evaluator.
- Contributor path: import-map changes live in `PluginWorkspaceMutator`; list/doctor metadata loading lives in `plugin-registry.ts`.

## Evidence

- Fix B unit gate: `deno test --unstable-kv --allow-all packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts packages/cli/src/kernel/adapters/scaffold/tests/import-resolver_test.ts packages/cli/src/kernel/adapters/config/plugin-registry.test.ts` -> pass.
- Focused check: `deno check --unstable-kv packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts packages/cli/src/kernel/adapters/config/plugin-registry.ts packages/cli/src/public/features/plugins/list/list-plugins-command.ts packages/cli/src/public/features/plugins/doctor/doctor-plugin-use-case.ts packages/cli/src/kernel/adapters/scaffold/import-resolver.ts packages/cli/src/public/adapters/jsr-import-resolver.ts` -> pass.
- Fix A/B unit gate after both commits: `deno test --unstable-kv --allow-all packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts packages/cli/src/kernel/adapters/scaffold/tests/import-resolver_test.ts packages/cli/src/kernel/adapters/config/plugin-registry.test.ts` -> pass, 13 passed.
- Scoped package check: `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` -> pass, 524 files selected, 0 diagnostics.
- Touched-file lint: `deno lint --no-config <10 touched CLI files>` -> pass, 10 files checked.
- Touched-file fmt under root repo config: `deno fmt --check --config deno.json --permit-no-files <10 touched CLI files>` -> pass, 0 files checked because root `deno.json` excludes `packages/cli` from fmt.
- Prod CLI e2e: `rtk proxy deno task e2e:cli:prod --cleanup --format pretty` -> pass, `Summary: passed=47 failed=0`; includes `scaffold.plugin-list`, all five official plugin adds, `behavior.plugins-health`, generated workspace check, and Aspire runtime behavior.
