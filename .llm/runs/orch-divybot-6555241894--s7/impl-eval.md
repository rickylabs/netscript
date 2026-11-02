# Independent final implementation evaluation

Owner-selected Claude Opus 5.5 high, same separate read-only evaluator throughout. Full result follows; private evaluator identifiers are not published.

# Final IMPL-EVAL: S7 phase 1 (#2420)

**Verdict: PASS.** The implementation is accepted. The full runtime check, `scaffold.runtime`, is still **UNPROVEN** and is not counted as a pass.

## Assessment by area

- **Builder codec, presets and Utility-only:**
  - `/create` uses the real `ns1_` codec through `packages/cli/src/kernel/domain/ui/ui-preset.ts`; there is no copied decoder.
  - The builder rejects unknown themes, any non-Utility style, and any font or icon-library setting (`tools/docs-site/fresh-ui/builder.ts`).
  - The only style on offer is `style-utility` (`COMPONENT_STYLES` in `catalog.ts`). The supported options are fixed: 24 token presets, and choosing a Studio flavor picks a Studio preset.
  - The code copied from the built `/create` page was decoded by the real local-source `init`, which exited 0. `proof/token-comparison.json` shows `canonicalCssExact: true`, `selectedResolvedTokensExact: true`, and 1,180 tokens in each of light and dark.
- **Props from `deno doc`, registry discovery and freshness:**
  - `generate.ts` builds pages from the registry's component and block entries: 52 items, which picks up the PR2488 additions automatically.
  - Props come from `deno doc --json`. A hash over the inputs drives the freshness check in `check.ts`, which runs in the build chain (`docs/site/deno.json`) and in CI (`generate_test.ts` via `.github/workflows/pages.yml`).
- **Real examples, static output and byte limits:**
  - Examples are type-checked and bundled. Each preview loads that preset's actual stylesheet and waits for it before rendering.
  - The build produced 316 HTML pages. The largest Markdown twin is 5,013 bytes, under the 12,288-byte limit. A second build reproduced the output (1,115 files).
- **MCP routing and full `get_doc`:**
  - All 52 pages come back verbatim and within the MCP size budget (`packages/mcp/tests/component-guidance_test.ts`).
  - The component shortcut now fires only when the question explicitly mentions components. Three framework questions (service pagination, worker progress, MCP search) are tested and correctly do not route to component pages.
  - The locked ranking policy is unchanged, and the four existing guidance suites pass (36 tests in total).
- **#2410:**
  - Inline code in callouts is now escaped and skips existing `<code>` spans (`docs/site/_plugins/callout.ts`).
  - `absoluteUrl` no longer doubles the base path and gives the same result if applied twice (`ai-tooling.ts`).
  - Real Vento tests for both cases fail on the old code and pass now (`markdown-render-fixture.ts`; 39 tests pass).
- **Browser and style negative controls:**
  - The isolated CSS files are listed exactly and checked against SHA-256 hashes of both the source and Lume's minified output.
  - `preview.css` is audited in its own Utility token context, with misplaced-red and raw-colour checks that are shown to fail when they should.
  - A deliberately wrong Cloud stylesheet is detected.
  - The outer docs style policy still holds its original negative checks and skips only the hash-verified `assets/fresh-ui/*` files.
  - Result: 158 passed, 6 skips (census only), 0 unexpected, 0 flaky.
- **isolatedDeclarations repair:** the explicit `UiPreset` interface with `z.ZodType<UiPreset>` is equivalent for both callers: `resolve-preset.ts` uses `safeParse`, `ui-preset-command.ts` uses `parse`, and neither uses `.shape`. No suppressions were added. The earlier type-check failure came from an exploratory run with the wrong config; it was rerun with the maintained `docs.deno.json`.
- **Rendered comparison:** in both schemes, all 1,180 computed properties match and the primary Button styles are identical (`proof/render-comparison.json` has `tokenDifferences: []`).
- **Local gates:** all 15 root `check:*` tasks, `release:preflight` and the docs links, accuracy, snippets and contract-derivation checks pass. The quality gate and the scoped JSR audit and publish dry-run also pass.

## Blockers

None.

## Not proven (the operator permitted recording these as UNPROVEN)

- **`scaffold.runtime --cleanup`:** exited 1 because Docker is unavailable. Setup passed; the Aspire preflight and stop steps failed. The full runtime never ran.
- **Leak inventory:** UNPROVEN. 24 resources of unknown ownership were left untouched; no resources owned by this run survived.

## Remaining administrative steps (not missing work)

- Final CI on the exact head commit after the last evidence commit. So far only the Pages and Utility job on cf1a8f8 has passed.
- Moving the PR from draft to ready, which still has to stay Refs #2420 only, with no labels and no session IDs.

## Non-blocking notes

1. The density label differs between the server-rendered page and the JavaScript-updated one; cosmetic.
2. `check.ts` only checks that each preset CSS file exists and is non-empty. The browser hash checks cover whether the content is correct.
3. `component-guidance.ts:15` has a redundant guard.
4. A question that mentions only "props" or "keyboard" counts as a component question. It is acceptable for now; watch for false positives as the corpus grows.
5. Build intermediates are written to `.llm/tmp/fresh-ui-docs`, which is fine under the repo's temp-file policy.
