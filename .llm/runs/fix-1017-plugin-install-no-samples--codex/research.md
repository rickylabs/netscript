# Research — fix-1017-plugin-install-no-samples--codex

## Re-baseline

- Carried-in source: issue #1017 report and traced cause supplied by the owner.
- Re-derived against `main` @ `3ab64720f` on 2026-08-01.
- What changed vs the carried-in version: the cause holds. One additional load-bearing hazard was
  confirmed: every official plugin barrel currently re-exports its sample files, not only workers.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `--no-samples` parses as `includeSamples: false` and reaches `PluginInstallPlan`. | `packages/cli/src/public/features/plugins/install/install-plugin-command.ts`; `plan-plugin-install.ts` |
| 2 | Official installs dispatch a plugin-owned subprocess; `runPluginOwnedScaffold` drops `plan.includeSamples`. | `packages/cli/src/public/features/plugins/install/install-plugin.ts` |
| 3 | The subprocess context includes only `pluginName` and `mcp`; other callers already supply an explicit `includeSamples` intent. | `packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts`; caller search for `dispatchPluginScaffold` |
| 4 | The adapter forwards `context.options` but `collectInstallArtifacts` emits every starter resource. | `packages/plugin/src/adapter/commands/install.ts` |
| 5 | All six reported sample paths are emitted by starter resources in workers, sagas, triggers, and streams. | `plugins/{workers,sagas,triggers,streams}/src/adapter/plugin.ts` |
| 6 | Workers, sagas, triggers, and streams barrels re-export sample files; unchanged barrels would be dangling under `--no-samples`. Runtime glue imports plugin runtime entrypoints, not sample files. | `plugins/*/src/adapter/resources/{barrel,glue}` |
| 7 | The CLI E2E harness already maps its `samples` state to `--samples` / `--no-samples`; a black-box assertion gate can install all four official plugins and check exact paths. | `packages/cli/e2e/src/application/gates/scaffold/plugin-install-gates.ts`; `true-userland-install-suite.ts` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `@netscript/plugin/adapter` export map and `InstallStarterResource` declaration.
- Planned public change: one optional additive samples policy on `InstallStarterResource`; explicit
  documentation and types are required. Undefined preserves the published behavior.
- Slow-type / surface risks: use an explicit named discriminated policy type and explicit function
  return types. No export-map or dependency changes are planned. Verify with package check,
  `deno doc --lint`/quality gates as selected by the harness, and the requested scoped tests.

## Open questions

- None. The barrel fallback behavior must be solved in the adapter contract before implementation;
  emitting a dangling barrel is not acceptable.

