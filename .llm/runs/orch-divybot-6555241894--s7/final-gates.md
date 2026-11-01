# Final local gate evidence

Source head cf1a8f80985967642cc8a4dcf80bd0c97c990c01, normally integrated with main 0af8fd9e7904ee2c848d0a4213c7853edec3ad21. Deno 2.9.7. Public proof uses repository-relative paths. Command logs/receipts retain raw statuses privately; retained summaries below distinguish runtime limitations.

| Gate | Measured outcome |
| --- | --- |
| Built site/rendered output/freshness | PASS: 316 HTML pages; 52 generated components/blocks and 24 presets; maximum twin 5,013 bytes |
| Full docs browser/style native receipt | PASS exit 0: 158 passed, 6 census-only policy skips, 0 unexpected and 0 flaky; all 12 required page/viewport/scheme cases and the full 52-item census execute |
| Two-build output reproduction | PASS exit 0: 1,115 files, 316 HTML, 310 search artifacts, 262 twins; only explicitly reported upstream Pagefind metadata differences |
| Site links/caveats | PASS locally in slice 1; current merged-tree Pages build/link/caveat CI PASS |
| Root docs:links, docs:accuracy, docs:snippets, docs:contract-derivation | All PASS, raw exit 0 |
| release:preflight | PASS, raw exit 0 |
| All 15 current root check:* tasks | All PASS: agent-docs-prose, mcp-export-corpus, assets-barrel, publish-assets, desktop-native-fixture, emitted-samples, streams-types, child-health-docs, scaffold-versions, aspire-version-parity, netscript-jsr-specifiers, aspire-host-ports, figma-names, review-threads, design-skill |
| Component + all four locked guidance suites | PASS: 36 tests, no ranking policy retune; ordinary framework negative cases included |
| Vento/Markdown renderer regression suite | PASS: 39 tests, including prior-red actual xref/callout cases |
| Existing codec/init safety | PASS: 32 tests |
| CI docs tooling tests | PASS: 20 tests, including 4 new native-doc/codec/freshness controls |
| Exact CI scoped tooling + browser check/lint/fmt | All PASS on committed source with their maintained configs |
| Scoped MCP check/lint/fmt; site page/plugin check/lint/fmt; CLI codec check/lint/fmt | All PASS; explicit codec formatting uses site configuration because root quality excludes the CLI |
| Broad quality:gate native receipt | PASS, exit 0: configured quality scan plus architecture/dependency gates; existing cardinality warnings retained, no new accepted debt |
| Scoped MCP JSR audit and publish dry run | PASS exit 0; parent cardinality warnings retained |
| Actual built builder -> init -> app render | PASS, exit 0; see cli-proof.md and proof/ JSON/screenshots. Both schemes: all 1,180 resolved tokens exact, all 1,180 computed properties semantically equal, primary Button colors/geometry/typography/spacing equal |
| One-pass scaffold.runtime --cleanup --format pretty | **UNPROVEN**, attempted command raw exit 1. Setup passed; preflight.aspire and cleanup.aspire-stop failed because Docker daemon is unavailable. Full runtime did not execute. This is the operator-authorized environmental limitation, never a PASS |

The initial over-broad exploratory scoped type-check mixed the browser suite into the repository root’s isolatedDeclarations config and failed. Re-ran the exact maintained CI browser command using docs.deno.json plus separate tooling/MCP/site/codec scopes; all pass. No source/workflow suppression was added to hide a type failure.

Remote Pages verification on cf1a8f8: build, rendered reproduction, links/caveats and Utility docs browser/style job **success**, run 41293556134, job 124809782420. Other workflows are currently policy-skipped while draft; final ready/CI state remains to be captured before READY. Do not infer final exact-head readiness from this intermediate remote state.

## Resource hygiene

Read-only leak reporter exits 0. Verdict **UNPROVEN environment inventory** because Docker/volume/network probes are unavailable. Survivor ownership counts: {'unproven': 24}. Owned survivors: 0; foreign/unproven resources untouched. Three positively identified proof server/Vite child processes were terminated after capture. Public report deliberately retains only verdict/counts, without resource identities or raw inventory.
