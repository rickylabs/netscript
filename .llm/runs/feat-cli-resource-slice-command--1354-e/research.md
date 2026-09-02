# Research — feat-cli-resource-slice-command--1354-e

## Re-baseline

- Carried-in source: `origin/feat/cli-resource-slice-plan:.llm/runs/feat-cli-resource-slice--1354/plan.md`.
- Re-derived against the owner-provided integration base
  `0faae3fde8d11879b2bae57d0e09d0f5c66dda41` on 2026-09-02.
- Slice B's Fresh staging adapter and Slice D's resource template renderer are present. Slice C's
  planner/reconcilers are present. The #1664 selector extraction is not present, as stated by the
  owner.
- PR #1664 is open at head `9e09364407c90138773acda845ffbf54ed007fa6`; its live 164-file diff has
  zero intersections with the reduced five-file Slice E product touch set. Its only planned Slice E
  overlap, `public-command-dependencies.ts`, is explicitly off-limits in this run.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `planResourceSlice`, rendering, ownership markers, and complete reconciliation already exist. | `packages/cli/src/kernel/application/resource-slice/` |
| 2 | Fresh derivation supports staging through `routesDir` and `outputPath` overrides. | `fresh-route-manifest.ts` and its tests |
| 3 | `resolveUiAppRoot` is the existing app-selection seam. | `kernel/application/ui/resolve-ui-app-root.ts` |
| 4 | No reusable client selector exists on this base; `web-scaffold.ts` contains only a private legacy finder. | `rg "findBinding" packages/cli/src/kernel/application/ui/web-scaffold.ts` |
| 5 | Public command failures use typed `CliExitError` subclasses and the binary owns process termination. | `kernel/domain/errors/cli-exit-error.ts`, `public/composition/run-public-cli.ts` |
| 6 | The command must remain absent from `generate-group.ts` and `public-command-tree.ts`. | locked Slice E/F boundary |

## jsr-audit surface scan

- Surface scanned: `packages/cli/deno.json`, `mod.ts`, and the planned unregistered feature files.
- This slice adds no export-map or package metadata entry. Exported feature symbols need explicit
  return types and JSDoc to avoid slow-type/doc regressions if a later slice exports them.
- Publish contents, allowed specifiers, full export-map documentation, and slow-type status will be
  checked by the package JSR audit and publish dry-run.

## Open questions

- None that reopen the evaluated plan. The missing selector is resolved for this deliberately
  unregistered slice by an injected `ResourceClientResolver` seam. It receives the optional
  `--client` value unchanged and performs no local discovery. Slice A's selector becomes its
  implementation when Slice F activates the command.
