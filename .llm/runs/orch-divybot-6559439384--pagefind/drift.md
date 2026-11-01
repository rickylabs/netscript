# Drift

- None in product scope. Environment differs from skills' assumptions: gh exists, RTK does not. Use gh and focused native shell commands.
- Owner override governs evaluator model, assigned branch, Refs-only/no-label PR policy, and cockpit merge. This is explicit authorization, not an inferred exception requiring confirmation.

- PLAN review identified `.github/scripts/ci-classify-changes.test.ts` pins the bounded flag. Add this existing workflow contract test to declared scope before implementation; update it to reject the allowance when CI switches to strict.
- PLAN correction scopes stable ingestion into a composed native Pagefind plugin with real Lume/native shuffled-input fixture and root-compatible test bridge, all under the previously declared Pagefind integration surface. Root configured quality scan covers docs/site, so include quality:gate even though no framework package changes.
- Baseline comparison found only `assets/fresh-ui/catalog.json` changes outside Pagefind: its existing inputHash intentionally includes docs/site/deno.json, which now pins the corrected dependency. Recomputing the pre-change input hash and substituting only that field reproduces the exact baseline file SHA-256. All 804 other non-search outputs, including HTML/twins/llms/registry, match baseline unchanged. This is expected provenance evolution between different sources, not an allowance in repeated-build proof.
- Direct remote CLI frozen gate needs explicit `--config deno.json` (otherwise Deno ignores the local import map for remote main). The corrected command passes. Ordinary frozen Lume task also passes.

- During final handoff main advanced from1e4e58f to4cb0298 (#2572 Utility scaffold redesign). Merge normally as explicitly requested; do not rebase/force-push. Its Fresh UI command-palette assets affect generated docs previews, so prior final-head787f211 proof remains historical. Repeat native strict comparison, full Utility browser and integration quality/carrier checks on the merge head; re-steer same evaluator. No authored changes to sibling scaffold/palette code.
