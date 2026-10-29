# Gate evidence

All commands below ran locally. Durable allowlisted command receipts and full browser artifacts are retained in the private project evidence store; public records avoid operator paths.

| Gate | Result |
| --- | --- |
| `check:desktop-native-fixture` | PASS |
| `check:emitted-samples` | PASS |
| `check:streams-types` | PASS |
| `check:child-health-docs` | PASS |
| `check:mcp-export-corpus` | PASS |
| `check:assets-barrel` | PASS |
| `check:agent-docs-prose` | PASS |
| `check:publish-assets` | PASS |
| `check:scaffold-versions` | PASS |
| `check:aspire-version-parity` | FAIL initially; one-row inventory freshness repair and successful recheck below |
| `check:netscript-jsr-specifiers` | PASS |
| `check:aspire-host-ports` | PASS |
| `check:review-threads` | PASS |
| `docs:links` | PASS |
| `docs:snippets` | PASS |
| `docs:accuracy` | PASS |
| `docs:exports-drift` | PASS |
| `docs:readme-fences` | PASS |
| `docs/site verify` | PASS |

`aspire-surface-manifest.ts`: adds comparisons/_data.ts to existing public-doc ownership; 995 rows, zero unmatched. Durable aspire-version-parity recheck: PASS. No Aspire pin or ownership policy changed.

Structured API/MCP and prior regression set: 36 passed, zero failures. Separate picker component fixtures: 2 passed. Source/data checks and source-only format/lint pass. Tool lint uses the docs config to cover paths the root lint config excludes; no false empty verdict.

Browser full suite: 140 passed in four light/dark × 390/1280 projects. Focused comparison rerun after source-link whitespace correction: 16 passed. Scenario selection, keyboard, panel/descendant fragments, JS-disabled HTML and Markdown, serious/critical axe violations, responsive width and script errors are checked. Screenshot inspected on mobile.

Prose checkpoint 9a308f9, then mcp export corpus, assets barrel and publish assets in order. Both non-site context entries remain decoded-byte-identical to main. No root or docs lock changes.

Full CLI scaffold runtime remains UNPROVEN on this worker: Docker unavailable, as recorded during #2471. Runtime/scaffold CI is explicitly skipped for this docs-only slice; neither that selection nor static checks is claimed as runtime acceptance.

CI reconciliation: docs browser preparation checks browser test files with the docs formatter config, while the original local format invocation inherited the tools/root config. Reformatted only the new comparisons.spec.ts using the exact CI config; structured CI formatter selection passes all three files. This is whitespace/quote style only; browser behavior is unchanged.

CI test-shard reconciliation: root discovery compiled the carried picker fixture without the standalone Lume import map. Follow the existing markdown-render bridge: keep root-discovered scenario-picker_test.ts as a subprocess bridge, move both full rendering assertions to scenario-picker-fixture.ts, and include that fixture in the site test task. No tests deleted, skipped or weakened; both assertions run with the site’s authoritative import map.
