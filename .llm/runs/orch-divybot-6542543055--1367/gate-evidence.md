# Gate evidence

All commands ran from the repository root. Raw outputs and private resource metadata remain outside
tracked/public artifacts; structured wrapper verdicts and durable run-gate receipts were retained.

| Gate | Result | Evidence |
| --- | --- | --- |
| Final structured focused test set | PASS, exit 0, 258 passed / 0 failed / 0 ignored | run-gate `test`, invocation streams-storage-focused; includes streams tests, durability + process restart, Aspire config, generated-helper runtime/lint variants, runtime suite registry and new restart negative controls |
| Scoped type check | PASS, exit 0, 73 selected files / 0 diagnostics | run-deno-check.ts, --unstable-kv default, streams plus changed Aspire/CLI surfaces |
| Scoped source lint | PASS, exit 0, 15 selected / 15 processed | run-deno-lint.ts with style-only config so root CLI exclusion cannot silently omit files |
| Scoped source format check | PASS, exit 0, 15 selected / 15 processed | run-deno-fmt.ts with same style-only config, ts/tsx only |
| Repository quality + architecture | PASS, exit 0 | run-gate quality-gate / streams-storage-quality, chains quality:scan and arch:check including dependency gates; zero quality findings, seven unchanged allowances, inherited architecture advisories |
| Streams verify-plugin | PASS, exit 0 | plugins/streams/verify-plugin.ts |
| Streams JSR audit | PASS with inherited slow-type advisory, exit 0 | audit-jsr-package.ts --root plugins/streams --text |
| Changed public exports doc-lint | PASS, exit 0, zero diagnostics | doc:lint --root plugins/streams --entrypoints ./src/aspire/mod.ts; packages/aspire --entrypoints ./config.ts --entrypoints ./types.ts |
| Full export-map doc-lint | INHERITED RED, exit 1 | streams: two missing CLI JSDoc plus one plugin-contributions private type reference; Aspire: preexisting adapter/application/public/testing private-type refs; touched config/types and streams Aspire subpath have zero diagnostics |
| Internal documentation links | PASS, exit 0 | deno task docs:links |
| Actual generated-project Aspire restart | PASS → intentional FAIL → restored PASS | runtime-proof.md and negative-controls.md; real producer HTTP history verified before and after resource restart |
| Review thread gate | PASS, zero threads / zero unanswered | deno task check:review-threads -- --repo rickylabs/netscript --pr 2520 --pretty |
| Full scaffold.runtime | REQUIRED CI, not run locally | owner prohibits local suite; coordinator must arm e2e-cli-gate on PR #2520 |

No lock changes, suppressed tests, new scanner allowances or weakened durability claims.

## CI generated-prose remediation

CI quality's agent-docs-prose freshness check exposed an owned missing generated artifact. Native
regeneration refreshed only the embedded streams page (208 entries retained, zero removed).
`check:agent-docs-prose`: exit 0, fresh true, no stale paths. `check:publish-assets`: exit 0.
Independent same-session slice review decoded before/after content and returned PASS. No runtime
source, tests, dependencies or locks changed. New-head CI and exact-head review remain required.

## Coherent main integration and complete generated closure

Normal main merge to 15cffa2 (#2517/#2421), no custom source conflict. Native MCP corpus generation
updates four API rows for directory declarations/constructor; no removed rows. All four freshness
checks pass: MCP export corpus, agent-docs prose, publish assets and staged assets barrel.
quality:gate passes and 258 focused/regression tests pass. Explicit current-source generated-plugin
sync followed by the actual minimal Aspire restart proof passes with main's native service factory;
exact focused AppHost stopped. Independent combined-slice review PASS. Clone-based corpus tests
must be rerun after committing, because they clone HEAD rather than the working directory.
