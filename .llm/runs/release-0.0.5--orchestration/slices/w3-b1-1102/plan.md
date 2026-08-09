# Plan: intent-aware MCP capability discovery (#1102)

## Run Metadata

| Field          | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| Run ID         | `release-0.0.5--orchestration/slices/w3-b1-1102`                         |
| Branch         | `fix/mcp-intent-aware-discovery`                                         |
| Phase          | `plan-eval`                                                              |
| Target         | `packages/mcp`, `packages/cli` agent guidance, consumer skills, MCP docs |
| Archetype      | `6 — CLI / Tooling`                                                      |
| Scope overlays | `SCOPE-docs`                                                             |

## Archetype and doctrine

`@netscript/mcp` ships a stdio CLI entry and an enumerable tool protocol, so Archetype 6 is the
smallest fitting profile. The package predates the doctrine verdict inventory and has no explicit
row in doctrine file 10; this plan applies A6 constraints without claiming a new global verdict. The
docs overlay applies because public MCP reference, package README, generated `AGENTS.md`, and
consumer skill guidance change.

| Axiom / rule     | Application                                                                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1 / A2          | Define `find_guidance` input/output and public types before retrieval implementation.                                                                                       |
| A6 / A7          | Keep the scorer as one justified, tested NetScript retrieval policy; use platform regex, `URL`, `TextEncoder`, and `crypto` rather than wrapper helpers or a network model. |
| A8 / R-FOLD-CARD | Move the existing docs contract and docs flows into role/feature folders so the feature does not deepen current cardinality warnings.                                       |
| A10              | Compose one shared corpus capability into the existing `createMcpCliServer`; no second corpus or container.                                                                 |
| A14              | Actual release-corpus evaluation, adapter parity, bounds, package gates, doc-lint, and publish dry-run are deliverables.                                                    |

Anti-patterns in scope are AP-1 (avoid expanding the 480-line docs god test), AP-2/AP-9 (no generic
ranking helper or speculative abstraction), AP-18 (semantic assertions, not giant snapshots), AP-21
(do not deepen flat folders), and AP-25 (filesystem stays in its adapter).

## Goal

Ship a bounded offline `find_guidance` MCP workflow that accepts a natural-language task and returns
ordered section citations, reasons, prerequisite → implementation → verification routing, cited code
examples, related links, and an honest confidence/fallback. Keep `search_docs` literal and `get_doc`
exact. Make the new workflow the instructed first step before unfamiliar NetScript implementation.

## Acceptance rows from the live issue

> - [ ] An intent-aware guidance tool/flow returns ordered section-level guidance and cited code
>       excerpts.
> - [ ] A checked-in evaluation corpus defines expected top-k results for the intents above and
>       passes deterministically.
> - [ ] Retrieval handles concept mismatch without requiring the user to know NetScript's exact
>       symbol names.
> - [ ] Internal links contribute prerequisite/next-step routing.
> - [ ] Filesystem and embedded corpora have parity and bounded responses.
> - [ ] MCP instructions and generated agent guidance activate the flow before unfamiliar
>       implementation work.
> - [ ] Follow-up observed usage/adoption is tracked only in #1090.

## Scope

- Add `find_guidance` as the 22nd read-only MCP tool with a strict Standard Schema contract.
- Add public guidance vocabulary under the existing docs corpus boundary: stage, confidence, section
  citation, code excerpt, related-link relation, recommendation, and bounded result.
- Parse Markdown sections, fenced examples, raw Vento `tabbedCode` examples, and internal links into
  one shared immutable index used by filesystem and embedded adapters.
- Rank sections deterministically with length-normalized lexical scoring, finite concept aliases,
  phrase boosts, stable tie-breaking, and one-hop link-graph expansion.
- Extend the existing generated embedded selection with `llms.txt` and the issue-required
  destination pages while preserving provenance and the 262,144-byte budget.
- Add a checked-in expected-top-k corpus evaluated against the actual generated release documents,
  plus synthetic parser/link edge tests.
- Update MCP instructions, generated `AGENTS.md`, bundled consumer skill guidance, the real CLI
  stdio smoke, package/site docs, counts, and generated assets.

## Non-scope

- No embeddings, model download, network retrieval, vector database, or telemetry collection.
- No rewrite or semantic change to `search_docs`, `get_doc`, corpus-root precedence, command
  execution, receipts, or the #1068 task-router generator.
- No second embedded-corpus path and no duplication of #1375/#1376.
- No observed adoption claim, agent-arm experiment, #1090 checkbox, merge, publish, canary, or
  release dispatch.

## Locked decisions

| ID  | Decision                                                                                                                                                                                                                                                                                                                          | Rationale                                                                                                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Name the tool `find_guidance`; input is `{ intent, limit? }`.                                                                                                                                                                                                                                                                     | It answers a task and remains clearly distinct from literal search.                                                                                                                         |
| D2  | Return `intent`, `confidence`, ordered `recommendations`, `related`, optional `fallback`, and `truncated`. Each recommendation has `stage`, `slug`, `section`, `why`, bounded `excerpt`, and bounded code citations.                                                                                                              | Directly represents every product-shape requirement without raw document bodies.                                                                                                            |
| D3  | Stages are the finite constants `prerequisite`, `implementation`, and `verification`; link relations are `prerequisite`, `next`, and `related`; confidence is `high`, `medium`, or `low`.                                                                                                                                         | Finite domain vocabulary gives schema/runtime parity and stable consumers.                                                                                                                  |
| D4  | Use deterministic section-level BM25-style scoring (document-frequency/length normalization), title/heading/phrase boosts, curated concept groups, and slug/section lexical signals. Stable ties sort by slug then section.                                                                                                       | Fixes length bias and vocabulary mismatch offline without introducing a model dependency.                                                                                                   |
| D5  | Parse direct internal Markdown links and fragments; infer relation from source headings (`Prerequisites`/`Before*`, `Next steps`, `Related`/`See also`), then traverse one hop from high-scoring sections. Link score can route/order but cannot replace a positive lexical/concept seed.                                         | Makes links meaningful while preventing graph popularity from overwhelming intent.                                                                                                          |
| D6  | Parse both fenced Markdown code and the repo's raw Vento `tabbedCode` `lang`/`code` entries. Return at most two code excerpts per recommendation, each cited by slug and section.                                                                                                                                                 | Filesystem source and release-rendered Markdown then expose equivalent examples.                                                                                                            |
| D7  | Put docs domain files in `src/domain/docs/` and docs flows in `src/application/docs/`; both adapters call the same pure index/ranker.                                                                                                                                                                                             | Preserves layering and avoids deepening current domain/flow cardinality warnings.                                                                                                           |
| D8  | Refresh the stale checked-in prose mirror through `/home/codex/repos/.briefing/build-docs-bundle.sh` and `.llm/tools/docs/build-agent-docs-bundle.ts`, then extend `MCP_EMBEDDED_DOC_PATHS` with `llms.txt`, validated-form, query/cache-first, custom-plugin, and unsupported-driver sources and regenerate the existing assets. | The current mirror predates the unsupported-driver section. This reuses #1375's canonical source/generator chain and checked 262,144-byte budget; no alternate runtime fallback is created. |
| D9  | Evaluation JSON names five intents and exact ordered top-three `slug#section` destinations. Tests run it against the generated release selection, measure recall@3 = 1.0, and repeat runs byte-for-byte.                                                                                                                          | Actual docs plus decoys make rank quality falsifiable; expected results are not derived from runtime output.                                                                                |
| D10 | Low-support queries return low confidence and an explicit literal-search fallback rather than fabricated stages.                                                                                                                                                                                                                  | Honest failure is part of the public contract.                                                                                                                                              |
| D11 | Activation lives in MCP initialize instructions, generated `AGENTS.md`, and source consumer skills; generated barrels are regenerated, never hand-edited.                                                                                                                                                                         | Covers every host/agent entry point while preserving asset ownership.                                                                                                                       |

## Expected evaluation destinations

The checked-in JSON will lock these exact ordered section citations. Repeated documents are allowed
only where distinct sections represent distinct steps in the source; no expected value is derived
from runtime output.

| Intent                                                  | Rank 1                                                                                                                  | Rank 2                                                                                             | Rank 3                                                                                                               |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| validated route-bound form                              | `pages/web-layer/how-to/build-a-server-validated-form#define-the-form`                                                  | `pages/web-layer/builders#building-a-page`                                                         | `pages/web-layer/route#three-authoring-forms-one-generated-binding`                                                  |
| keep server data fresh without polling                  | `pages/web-layer/query#a-cache-first-load-pattern`                                                                      | `pages/tutorials/live-dashboard/03-sdk-cache-first-query#step-2-add-the-cache-first-query-factory` | `pages/tutorials/live-dashboard/04-definePage-QueryIsland#step-2-define-the-page-and-cache-first-resource-pipeline`  |
| add a capability NetScript does not ship                | `pages/orchestration-runtime/how-to/author-a-plugin#before-you-start`                                                   | `pages/explanation/plugin-system#a-plugin-is-a-thin-layer-over-a-core-package`                     | `pages/orchestration-runtime/how-to/author-a-plugin#step-1-scaffold-the-two-tier-skeleton`                           |
| use a Prisma-supported database NetScript does not wrap | `pages/data-persistence/how-to/use-a-second-database#unsupported-by-netscript-supported-by-prisma-libsql-turso-example` | `pages/data-persistence/how-to/use-a-second-database#3-application-owned-responsibilities`         | `pages/data-persistence/how-to/use-a-second-database#4-decision-rule-direct-use-vs-reusable-databaseadapter-wrapper` |
| build a real service-backed UI                          | `llms#task-router`                                                                                                      | `pages/tutorials/live-dashboard/04-definePage-QueryIsland#what-you-will-build`                     | `pages/tutorials/live-dashboard/03-sdk-cache-first-query#what-you-will-build`                                        |

PLAN-EVAL may reject a destination whose opened source does not support the intent. Implementation
may not rewrite this ordering to match observed output without recording drift and evaluator
approval.

## Test-first failure matrix

Every planned test has a real pre-fix red state:

| Test                                                              | Failure class                | Concrete pre-fix failure                                                                                                              |
| ----------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Registry/schema contract test for `find_guidance`                 | Behavioral                   | `tools/list` has 21 tools and a call returns `tool_not_found`; no input/output schema exists.                                         |
| Public guidance type fixture                                      | Compile-time                 | `DocsCorpusPort` has no guidance method and no stage/citation/code/link result types.                                                 |
| Release-corpus evaluation (five rows, exact top-3, repeatability) | Behavioral                   | Recorded current `search_docs` top results miss four required destinations and do not rank sections.                                  |
| Concept mismatch row “avoid hitting my service every render”      | Behavioral                   | Existing lexical search omits `web-layer/query` from the top five.                                                                    |
| Section/code extraction fixtures                                  | Compile-time then behavioral | `DocsSection` has no code/link fields; current parser returns section content only and cannot cite a code block independently.        |
| Vento `tabbedCode` fixture                                        | Behavioral                   | Current parser treats the component source as undifferentiated body text; it emits no language/code record.                           |
| Internal-link prerequisite/next fixture                           | Behavioral                   | Current parser emits no graph edges, so linked prerequisite/next sections cannot affect routing.                                      |
| Filesystem/embedded parity on identical real release sources      | Compile-time then behavioral | Neither adapter exposes guidance; current generated embedded selection also lacks four required destination pages and `llms.txt`.     |
| Bounds/low-confidence server test                                 | Behavioral                   | The tool is unregistered, so no recommendation/code/link bounds or explicit fallback can be validated.                                |
| MCP initialize activation test                                    | Behavioral                   | Current instructions mention docs only for hang troubleshooting and never request intent guidance before implementation.              |
| Generated `AGENTS.md` and bundled skill activation tests          | Behavioral                   | Current generated prose routes only symptom search / generic docs lookup and contains no unfamiliar-work `find_guidance` instruction. |
| Real `agent mcp` stdio smoke                                      | Behavioral                   | It asserts 21 tools and sends no `find_guidance` call.                                                                                |
| Docs drift test                                                   | Behavioral                   | README/reference/agent-tooling and tests are count-locked to 21 and contain no new tool contract.                                     |

## Ordered commit slices

| #  | Slice and proof                                                                                                                                                                                                                                                                     | Files                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Proving gate                                                                                                                                                                                                                                          |
| -- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 | Contract-first 22nd tool: domain types, Standard Schemas, registry metadata, flow shell, and red→green contract tests.                                                                                                                                                              | `packages/mcp/src/domain/docs/**` (move existing contract + new vocabulary), `packages/mcp/src/domain/tool-types.ts`, `packages/mcp/src/domain/tool-contracts.ts`, `packages/mcp/src/application/tool-registry.ts`, `packages/mcp/src/application/docs/find-guidance-flow.ts`, moved `docs-flows.ts`, `packages/mcp/mod.ts`, `packages/mcp/tests/guidance-contract_test.ts`, `registry_test.ts`, `stdio_test.ts`, run artifacts                                       | Focused Deno tests + scoped check; `tools/list` = 22 and malformed/oversized input is rejected.                                                                                                                                                       |
| S2 | One shared section index: concept aliases, normalized deterministic ranking, fenced/Vento examples, internal-link graph, stages/confidence/fallback, both adapters.                                                                                                                 | `packages/mcp/src/domain/docs/guidance-concepts.ts`, `guidance-index.ts`, moved `docs-corpus-port.ts`, `packages/mcp/src/infrastructure/filesystem-docs-corpus.ts`, `embedded-docs-corpus.ts`, `packages/mcp/src/application/docs/docs-flows.ts`, `find-guidance-flow.ts`, `packages/mcp/cli.ts`, `packages/mcp/tests/guidance-retrieval_test.ts`, focused fixtures, run artifacts                                                                                    | Parser/ranker/flow tests; repeated results are deeply equal, links change ordering in the asserted direction, code citations carry language+slug+section, low support returns fallback.                                                               |
| S3 | Real discriminator and fallback parity: refresh the stale canonical prose mirror through the existing approved builder chain, check in exact expected top-3, select issue-required release pages, regenerate owned assets, and prove filesystem/embedded equality plus hard bounds. | `.llm/assets/agent-docs/prose.json.gz`, `.llm/assets/agent-docs/provenance.json`, `packages/cli/src/kernel/assets/agent-docs.generated.ts`, `packages/mcp/tests/fixtures/guidance-evaluation.json`, `packages/mcp/tests/guidance-evaluation_test.ts`, `.llm/tools/generate-publish-assets.ts`, `.llm/tools/generate-publish-assets_test.ts`, `packages/mcp/src/publish-assets.generated.ts`, `packages/mcp/tests/release-embedded-docs-corpus_test.ts`, run artifacts | Canonical builder provenance identifies the current source commit; evaluation recall@3 = 1.0 with exact order and deterministic rerun; adapter parity; `deno task check:publish-assets`; 262,144-byte budget.                                         |
| S4 | Primary-workflow activation through MCP, generated `AGENTS.md`, consumer skills, and real public CLI stdio.                                                                                                                                                                         | `packages/mcp/src/application/runner/mcp-server.ts`, `packages/cli/src/public/features/agent/init/init-agent.ts`, `init-agent_test.ts`, `skills/netscript/SKILL.md`, `skills/netscript-build/SKILL.md`, `packages/cli/src/kernel/assets/skills.generated.ts`, `packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts`, run artifacts                                                                                                                                   | Initialize/agent-init/asset tests + real `agent mcp` stdio smoke (no AppHost/container) returning structured guidance.                                                                                                                                |
| S5 | Public docs and full package/consumer evidence; request serialized release smoke only after every non-Aspire gate is green.                                                                                                                                                         | `packages/mcp/README.md`, `docs/site/reference/mcp/index.md`, `docs/site/ai/agent-tooling.md`, any generated publish asset refreshed from owned generator, run artifacts                                                                                                                                                                                                                                                                                              | Docs drift/link/accuracy gates, package tests, scoped wrappers, explicit package quality/doctrine, JSR audit, doc-lint, package + root publish dry-run; then `EXPENSIVE-GATE-REQUEST`, granted leak-check bracket, exact one-pass `scaffold.runtime`. |

Each implementation slice will update `worklog.md` and `context-pack.md`, commit, push, and receive
one PR phase/slice comment before the next slice. No product source is touched before PLAN-EVAL
PASS.

## Validation plan

Decisive feature evidence is package-scoped. The two aggregates are recorded but explicitly
non-decisive because their configured roots omit `packages/mcp`.

| Order | Gate                                          | Command / evidence                                                                                                                                                                                                                      | Expected                                                                               |
| ----- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1     | Focused behavior                              | `deno test --no-lock --allow-env --allow-net --allow-run --allow-read --allow-write packages/mcp/tests/`                                                                                                                                | exit 0; named guidance/evaluation/parity/bounds tests pass                             |
| 2     | Real CLI stdio                                | `deno test --no-lock --allow-all packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts`                                                                                                                                                  | exit 0; no AppHost/container; 22 tools and `find_guidance` structured result           |
| 3     | Scoped check                                  | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/mcp --root packages/cli/src/public/features/agent --file packages/cli/src/kernel/assets/skills.generated.ts --ext ts,tsx --deno-arg --no-lock --pretty` | exit 0, selected files > 0; wrapper supplies `--unstable-kv` by default                |
| 4     | Scoped lint                                   | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/mcp --root packages/cli/src/public/features/agent --file packages/cli/src/kernel/assets/skills.generated.ts --ext ts,tsx --pretty`                       | exit 0                                                                                 |
| 5     | Scoped format                                 | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/mcp --root packages/cli/src/public/features/agent --file packages/cli/src/kernel/assets/skills.generated.ts --ext ts,tsx --pretty`                        | exit 0                                                                                 |
| 6     | Explicit code quality                         | `deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/mcp --root packages/cli/src/public/features/agent --pretty`                                                                                              | exit 0; no new `any`, cast escape, lint ignore, or allowance                           |
| 7     | Explicit doctrine                             | `deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/mcp`                                                                                                                                                        | exit 0 or only evaluator-accepted pre-existing findings; no cardinality deepening      |
| 8     | Aggregate framework law (non-decisive)        | `rtk proxy deno task quality:gate`                                                                                                                                                                                                      | raw exit recorded; explicitly not evidence for `packages/mcp`                          |
| 9     | Aggregate architecture (non-decisive for MCP) | `rtk proxy deno task arch:check`                                                                                                                                                                                                        | raw exit recorded; explicitly not evidence for `packages/mcp`                          |
| 10    | Asset freshness                               | `rtk proxy deno task check:publish-assets` and `rtk proxy deno task check:assets-barrel`                                                                                                                                                | exit 0; generated files reproduce byte-for-byte                                        |
| 11    | JSR audit                                     | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/mcp --text`                                                                                                                      | no new finding; baseline warnings reported honestly                                    |
| 12    | Full-export docs                              | `rtk proxy deno task doc:lint --root packages/mcp --pretty`                                                                                                                                                                             | combined diagnostics 0 across `.`, `./cli`, `./openapi-projection`                     |
| 13    | Publish surface                               | `rtk proxy deno task --cwd packages/mcp publish:dry-run` and `rtk proxy deno task publish:dry-run`                                                                                                                                      | raw exit 0; intended generated/docs files only                                         |
| 14    | Docs overlay                                  | `rtk proxy deno task docs:links` and `rtk proxy deno task docs:accuracy`                                                                                                                                                                | exit 0; names/count/contracts aligned                                                  |
| 15    | Review threads                                | `rtk proxy deno task agentic:review-threads -- --repo rickylabs/netscript --pr <n> --pretty`                                                                                                                                            | exit 0 before impl-eval/ready handoff                                                  |
| 16    | Serialized merge-readiness                    | After all above: write/push `EXPENSIVE-GATE-REQUEST`; on grant run pre-leak-check → exact `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` → post-leak-check                                                          | exact one-pass raw exit 0; no skipped decisive suite; artifact confirms no owned leaks |

No focused or full Aspire-backed command runs before a token grant. The 2026-08-09 clarification is
part of this gate: the token covers any AppHost/container start, while only the exact one-pass run
is the decisive serialized verdict.

## Risk register

| Risk                                                               | Mitigation                                                                                                                                                                 |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Common words still swamp relevance                                 | BM25 length normalization, finite aliases/phrases, section units, exact real-corpus top-3 gate.                                                                            |
| Curated aliases overfit the five rows                              | Keep concept groups general and add decoy/paraphrase cases; exact expectations live outside implementation.                                                                |
| Link graph promotes hubs                                           | One hop only; positive seed required; bounded relation boost; stable ties.                                                                                                 |
| Raw Vento parsing is brittle                                       | Support only the observed `tabbedCode` `lang` + JSON-string `code` contract with focused malformed-input tests; rendered fences remain primary.                            |
| Checked-in prose mirror is stale and fallback lacks required pages | Refresh only through the approved mirror→compressed-prose→publish-assets chain, extend its selected paths, and enforce provenance/freshness plus the existing byte budget. |
| Public contract grows an already large surface                     | Export only consumer-relevant guidance types/functions; doc-lint all export subpaths.                                                                                      |
| Existing cardinality/slow-type warnings are misclaimed             | Record baseline; folder moves improve/do not deepen; no closure claim without gate evidence.                                                                               |
| Response truncation destroys schema                                | Apply per-field/per-array bounds inside the flow below central truncation and validate post-truncation schemas.                                                            |
| Task router is copied and drifts                                   | Index `llms#task-router`; never duplicate its prose or generator.                                                                                                          |
| Evaluation is mistaken for adoption                                | PR and issue evidence state retrieval-quality only; #1090 remains the sole adoption experiment.                                                                            |

## Open-decision sweep

| Decision                                              | Status                         | Notes                                                                                                          |
| ----------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Exact rank-2/rank-3 destinations                      | Resolved                       | All 15 citations are locked above after opening their source sections; PLAN-EVAL must reject unsupported rows. |
| Numeric BM25/boost constants                          | Resolved                       | `worklog.md` locks BM25 k1/b and every boost; no tuning after reading expected output without drift.           |
| Maximum recommendations/excerpts/links/string lengths | Resolved                       | `worklog.md` locks every collection and string bound; schema and flow share these constants.                   |
| Additional aliases beyond the five concepts           | Safe to defer                  | Only add when a checked-in natural-language case proves need.                                                  |
| Embeddings/local model                                | Safe to defer                  | Offline deterministic lexical hybrid satisfies this issue if evaluation passes.                                |
| Observed adoption                                     | Safe to defer, owned elsewhere | #1090 only.                                                                                                    |

No unresolved decision may force implementation rework after PLAN-EVAL.

## Arch debt implications

- No new debt planned.
- Existing MCP cardinality and slow-types audit findings remain baseline findings, not closure
  scope.
- If explicit `check-doctrine --root packages/mcp` reveals a new blocker that cannot be fixed
  without widening the cluster, stop and ask the orchestrator to file/rescope; do not add an
  allowance.

## Drift watch

- Any required destination absent after the approved canonical prose refresh.
- Any generated selection exceeding 262,144 bytes.
- Any parser need beyond observed Markdown fences/direct links/Vento `tabbedCode`.
- Any need to change corpus-root resolution or duplicate #1375.
- Any gate that silently skips guidance tests or omits `packages/mcp`.
- Any claim that the evaluation demonstrates real agent adoption.
