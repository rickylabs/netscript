# Regression gate recipes

Use deno run --no-lock --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts --
--allow-all <test-paths>. Reports expose passed/failed/ignored/totalResults; zero tests is not proof.
Deno --filter treats bare text as a substring; regex alternation needs /.../ delimiters. One
initial negative-control attempt selected zero tests; rerun without the filter to obtain real reds.

CI docs build checks docs:exports-drift before rendering. Adding @netscript/mcp/docs requires
its row in docs/site/reference/mcp/index.md and updating the entrypoint coverage explanation in
.llm/tools/docs/check-exports-drift.ts; README/module JSDoc alone does not satisfy that inventory.
