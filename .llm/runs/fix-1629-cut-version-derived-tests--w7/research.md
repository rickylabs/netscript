# Research — fix-1629-cut-version-derived-tests--w7

## Re-baseline

- Carried-in source: issue #1629 and release PR #1627 failure report.
- Re-derived against `main` @ `bf4b877f17b5cf34a96b6b40a424f19ca5073ddf` on 2026-08-13.
- The worktree and `origin/main` match the requested base. The issue's two causes reproduce in
  current test sources: derived inputs paired with literal `0.0.5` output assertions, and temporary
  plugin-install projects whose import maps are populated with current-tree JSR pins.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | Closure/config tests use `NETSCRIPT_RELEASE_VERSION` in inputs but literal `0.0.5` in expected diagnostics. | `rg -n "0\\.0\\.5" packages/cli/src/kernel/{domain/dependency-closures,templates/app,templates/workspace}` |
| 2 | The first-party control-plane import probe writes `@netscript/config` using `netscriptJsrSpecifier`, then the mutator adds further current-tree JSR pins. | `packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts` |
| 3 | AI plugin-install tests create a real temporary project with no local-source marker and later run `deno check`, so the mutator's current-tree exact pins are fetched from JSR. | `writeRealProjectFiles` in `packages/cli/src/public/features/plugins/install/install-plugin_test.ts` and the AI case in `install-local-plugin_test.ts` |
| 4 | Product code already keeps local-source and published-consumer behavior distinct; strict exact-version and split-identity checks are independently testable without registry availability. | `PluginWorkspaceMutator.ensureRootImportsForPluginKind` and dependency-closure tests |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/cli/deno.json` exports and the affected test-only paths.
- Slow-type / surface risks: none introduced by the planned work; no exported module, export map,
  package metadata, or JSDoc changes are planned. Existing package publish gates remain required by
  the release-cut proof.

## Open questions

- None. The issue enumerates the contract, failure classes, exclusions, and decisive gates.

