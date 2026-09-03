# Research — feat-cli-resource-slice-templates--1354-d

## Re-baseline

- Carried-in authority: `origin/feat/cli-resource-slice-plan` master plan, locked decisions D3/D4
  and Slice D.
- Required stacked baseline verified at
  `f2696ea88700b7f8e9db3a77a307719e802bc7f9`, exactly
  `origin/feat/cli-resource-slice-contract` (PR #1946).
- Current `origin/main` is `1ca47b85902317abff248c51ec6e313a0349bcf9`; this leaf deliberately
  remains stacked on the owner-mandated Slice C head rather than rebasing to main.
- The owner reports the master plan verdict as `PASS_PLAN_WITH_FINDINGS`, with the carrier
  ceiling amendment and settled D4 applied. This leaf does not re-plan those decisions.

## Findings

| # | Finding | Evidence |
| --- | --- | --- |
| 1 | All eleven neutral template assets and the renderer are absent at baseline. | Direct path probes under `kernel/assets/resource-slice/` and `application/resource-slice/`. |
| 2 | Slice C supplies the pure `planResourceSlice()` contract and exact marker/hash helpers; its five source files remain read-only. | `deno doc` plus focused source inspection. |
| 3 | `packages/cli` is Archetype 6 with doctrine verdict `Keep`; application rendering must consume ports and typed data, not import adapters or perform IO. | doctrine 05/06/10 and `ARCHETYPE-6-cli-tooling.md`. |
| 4 | Fresh Form B sidecars are default exports consumed by Fresh manifest derivation; pages bind the generated `appRoutes` reference with `.withRoute(...)`. | `packages/fresh/src/application/route/manifest.ts`. |
| 5 | Generated query factories supply `queryOptions(input)` and `clientKey(input)`; Fresh supplies `QueryIsland`, `useIslandQuery`, and query dehydration. | `deno doc` for SDK query and Fresh query entrypoints. |
| 6 | The template engine supports flat `{{name}}` variables and case pipes; conditional option fragments must be selected by the renderer. | `kernel/adapters/scaffold/template-adapter.ts`. |
| 7 | The exact mandated base contains 10 direct `application/resource-slice/` children. Slice D adds two, producing 12. The master plan's 14-child LOW-4 observation describes the later assembled A+C+D state because Slice A's two files are absent here. | direct child listing at `f2696ea88`. |
| 8 | No open architecture-debt entry is specific to the neutral resource family. Existing CLI debt is baseline-only and this slice must not deepen it. | `.llm/harness/debt/arch-debt.md`. |

## Frontend source note

The frontend overlay references `.claude/05-frontend.md`, but that file is absent in this checkout.
The installed `deno-fresh` skill, Fresh 2.x source/tests, and current generated app templates are the
available authorities. No external lookup is needed.

## JSR audit surface scan

- The package export map, `mod.ts`, and dependency graph do not change.
- New `.template` files are publish assets reached through the typed manifest and embedded carrier.
- The principal publish risks are an incomplete manifest/carrier cascade, unresolved template
  placeholders, generated code that does not type-check, and accidental slow/public types in the
  new internal renderer.

## Open questions

- None. D3/D4, the emitted roster, option deltas, marker format, and required gates are locked.

