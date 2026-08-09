# Plan: intent-aware MCP capability discovery (#1102)

## Run Metadata

| Field          | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| Run ID         | `release-0.0.5--orchestration/slices/w3-b1-1102`                         |
| Branch         | `feat/mcp-intent-activation-s4-s5`                                       |
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
- Add a checked-in expected-top-k corpus evaluated against both adapters over the same actual
  generated release documents, plus synthetic parser/link edge tests.
- Update MCP instructions, generated `AGENTS.md`, bundled consumer skill guidance, the real CLI
  stdio smoke, package/site docs, counts, and generated assets.
- Close the two retrieval gaps carried from #1404: the issue's exact render/fetch symptom and
  getting-started intent. Add one route-hint-free evaluation row that makes score direction
  falsifiable without changing the already locked five rows / 15 citations.

## Non-scope

- No embeddings, model download, network retrieval, vector database, or telemetry collection.
- No ranking/schema rewrite to `search_docs`, no semantic change to `get_doc`, corpus-root
  precedence, command execution, receipts, or the #1068 task-router generator. Narrow exception:
  `search_docs`' filesystem source universe intentionally gains root `llms.txt`, canonicalized as
  `llms`, so filesystem and embedded corpora expose the same task router.
- No second embedded-corpus path and no duplication of #1375/#1376.
- No observed adoption claim, agent-arm experiment, #1090 checkbox, merge, publish, canary, or
  release dispatch.

## Locked decisions

| ID  | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                   | Rationale                                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Name the tool `find_guidance`; input is `{ intent, limit? }`.                                                                                                                                                                                                                                                                                                                                                                              | It answers a task and remains clearly distinct from literal search.                                                                                                                                                              |
| D2  | Return `intent`, `confidence`, ordered `recommendations`, `related`, optional `fallback`, and `truncated`. Each recommendation has `stage`, `slug`, `section`, `why`, bounded `excerpt`, and bounded code citations.                                                                                                                                                                                                                       | Directly represents every product-shape requirement without raw document bodies.                                                                                                                                                 |
| D3  | Stages are the finite constants `prerequisite`, `implementation`, and `verification`; link relations are `prerequisite`, `next`, and `related`; confidence is `high`, `medium`, or `low`.                                                                                                                                                                                                                                                  | Finite domain vocabulary gives schema/runtime parity and stable consumers.                                                                                                                                                       |
| D4  | Use deterministic section-level BM25-style scoring (document-frequency/length normalization), title/heading/phrase boosts, curated concept groups, and slug/section lexical signals. Stable ties sort by slug then section.                                                                                                                                                                                                                | Fixes length bias and vocabulary mismatch offline without introducing a model dependency.                                                                                                                                        |
| D5  | Parse direct internal Markdown links and fragments; infer relation from source headings (`Prerequisites`/`Before*`, `Next steps`, `Related`/`See also`), then traverse one hop from high-scoring sections. Link score can route/order but cannot replace a positive lexical/concept seed.                                                                                                                                                  | Makes links meaningful while preventing graph popularity from overwhelming intent.                                                                                                                                               |
| D6  | Parse both fenced Markdown code and the repo's raw Vento `tabbedCode` `lang`/`code` entries. Return at most two code excerpts per recommendation, each cited by slug and section.                                                                                                                                                                                                                                                          | Filesystem source and release-rendered Markdown then expose equivalent examples.                                                                                                                                                 |
| D7  | Put docs domain files in `src/domain/docs/` and docs flows in `src/application/docs/`; both adapters call the same pure index/ranker.                                                                                                                                                                                                                                                                                                      | Preserves layering and avoids deepening current domain/flow cardinality warnings.                                                                                                                                                |
| D8  | Refresh the stale checked-in prose mirror through `/home/codex/repos/.briefing/build-docs-bundle.sh` and `.llm/tools/docs/build-agent-docs-bundle.ts`, then extend `MCP_EMBEDDED_DOC_PATHS` with `llms.txt`, validated-form, query/cache-first, custom-plugin, and unsupported-driver sources and regenerate the existing assets.                                                                                                          | The current mirror predates the unsupported-driver section. This reuses #1375's canonical source/generator chain and checked 262,144-byte budget; no alternate runtime fallback is created.                                      |
| D9  | Evaluation JSON names five intents and 15 expected `slug#section` citations. Four rows require exact ordered top-three results. The Prisma row requires its three named overlapping sections as an unordered top-three set. Every row runs against both filesystem and embedded adapters over the same release files; each adapter repeats byte-for-byte.                                                                                  | Actual docs plus decoys make rank quality falsifiable without pretending BM25 length normalization guarantees a stable order among a parent and its nested child sections. Expected results are not derived from runtime output. |
| D10 | Low-support queries return low confidence and an explicit literal-search fallback rather than fabricated stages.                                                                                                                                                                                                                                                                                                                           | Honest failure is part of the public contract.                                                                                                                                                                                   |
| D11 | Activation lives in MCP initialize instructions, generated `AGENTS.md`, and source consumer skills; generated barrels are regenerated, never hand-edited.                                                                                                                                                                                                                                                                                  | Covers every host/agent entry point while preserving asset ownership.                                                                                                                                                            |
| D12 | Treat public Markdown plus the root file `llms.txt` as the complete filesystem source policy. Rename the walkers to source-neutral names; admit `.md` normally and only `relativePath === "llms.txt"` for text files. Both adapters pass sources through one shared slug normalizer that strips `.md`/`.txt`; the publish-asset generator mirrors that rule so checked-in metadata also says `llms`. Both then call the same parser/index. | Makes the installed `agent init --with-docs` filesystem corpus and generated embedded fallback address the task router as `llms`, while excluding `llms-full.txt`, arbitrary `.txt` files, and any second indexing path.         |
| D13 | Cover `create a new NetScript project from scratch` through the existing `llms#Getting started` section. Add a finite `getting-started` concept with symptom/task-language aliases and a single heading route; do not add `pages/quickstart/index.md`, raise the 262,144-byte cap, or remove another domain document. | The current selection is 253,535 bytes. Quickstart is 20,986 bytes, so adding it would produce 274,521 bytes—12,377 over budget. `llms#Getting started` already embeds and cites the Quickstart entry. Raising the cap buys duplicated prose; removing contracts (18,823 bytes) or services (29,122 bytes) sacrifices broader capability coverage to make room. |
| D14 | Extend `cache-freshness` aliases with ordinary render/request language sufficient for the issue's exact paraphrase, including `hitting my service every render`; retain its existing terms, required corpus term, route hints, and all numeric ranking policy. | This repairs concept mismatch at the vocabulary bridge. It does not retune BM25 or encode a NetScript symbol in the caller's query. |
| D15 | Keep the original five evaluation rows and all 15 expected citations byte-for-byte. Add three separately identified rows: render/fetch mismatch (exact cache top-three), getting started (rank 1 `llms#getting-started`), and a score-only exact top-three for `pick direct application ownership versus a reusable integration`. The score-only row must activate zero concepts. | The two coverage rows close known gaps. The score-only row currently ranks the direct-vs-wrapper decision, unsupported-Prisma section, then external-database-by-hand section through ordinary scoring. Because `routeIndex` is equal for every candidate, reversing only `right.score - left.score` must make this row fail. |
| D16 | Use one activation sentence at every driving surface: before implementing an unfamiliar NetScript API or architecture, call `find_guidance` with the task; use `search_docs` for literal lookup and `get_doc` for exact retrieval. Regenerate consumer assets from source. | MCP initialize instructions, generated `AGENTS.md`, and both consumer skills then agree on when and how to activate the workflow without changing the roles of the older docs tools. |

## Expected evaluation destinations

The checked-in JSON will lock these 15 section citations. Four rows are exact ordered top-three. The
Prisma row locks one unordered three-citation set because its parent and nested child sections
overlap and BM25 length normalization does not justify their relative order. Repeated documents are
allowed only where distinct sections represent distinct steps in the source; no expected value is
derived from runtime output.

| Intent                                                  | Rank 1                                                                                                                                                | Rank 2                                                                                                                   | Rank 3                                                                                                                                             |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| validated route-bound form                              | `pages/web-layer/how-to/build-a-server-validated-form#define-the-form`                                                                                | `pages/web-layer/builders#building-a-page`                                                                               | `pages/web-layer/route#three-authoring-forms-one-generated-binding`                                                                                |
| keep server data fresh without polling                  | `pages/web-layer/query#a-cache-first-load-pattern`                                                                                                    | `pages/tutorials/live-dashboard/03-sdk-cache-first-query#step-2-add-the-cache-first-query-factory`                       | `pages/tutorials/live-dashboard/04-definePage-QueryIsland#step-2-define-the-page-and-cache-first-resource-pipeline`                                |
| add a capability NetScript does not ship                | `pages/orchestration-runtime/how-to/author-a-plugin#before-you-start`                                                                                 | `pages/explanation/plugin-system#a-plugin-is-a-thin-layer-over-a-core-package`                                           | `pages/orchestration-runtime/how-to/author-a-plugin#step-1-scaffold-the-two-tier-skeleton`                                                         |
| use a Prisma-supported database NetScript does not wrap | required in top 3, unordered: `pages/data-persistence/how-to/use-a-second-database#unsupported-by-netscript-supported-by-prisma-libsql-turso-example` | required in top 3, unordered: `pages/data-persistence/how-to/use-a-second-database#3-application-owned-responsibilities` | required in top 3, unordered: `pages/data-persistence/how-to/use-a-second-database#4-decision-rule-direct-use-vs-reusable-databaseadapter-wrapper` |
| build a real service-backed UI                          | `llms#task-router`                                                                                                                                    | `pages/tutorials/live-dashboard/04-definePage-QueryIsland#what-you-will-build`                                           | `pages/tutorials/live-dashboard/03-sdk-cache-first-query#what-you-will-build`                                                                      |

PLAN-EVAL may reject a destination whose opened source does not support the intent. Implementation
may not rewrite the four exact orderings or Prisma unordered top-three set to match observed output
without recording drift and evaluator approval.

### Continuation rows added after #1404

The five rows above and their 15 citations are immutable inputs from the passed foundation plan.
This continuation adds—not replaces or loosens—the following discriminators:

| Purpose | Intent | Constraint | Expected destination(s) |
| --- | --- | --- | --- |
| Acceptance-row-3 concept mismatch | `avoid hitting my service every render` | exact ordered top three | `pages/web-layer/query#a-cache-first-load-pattern`; `pages/tutorials/live-dashboard/03-sdk-cache-first-query#step-2-add-the-cache-first-query-factory`; `pages/tutorials/live-dashboard/04-definePage-QueryIsland#step-2-define-the-page-and-cache-first-resource-pipeline` |
| Getting started | `create a new NetScript project from scratch` | exact rank one | `llms#getting-started` |
| Score direction | `pick direct application ownership versus a reusable integration` | zero activated concepts; exact ordered top three | `pages/data-persistence/how-to/use-a-second-database#4-decision-rule-direct-use-vs-reusable-databaseadapter-wrapper`; `pages/data-persistence/how-to/use-a-second-database#unsupported-by-netscript-supported-by-prisma-libsql-turso-example`; `pages/data-persistence/how-to/use-a-second-database#connect-an-external-database-by-hand` |

The score-direction proof is a scratch-only mutation gate. From the committed implementation head,
create an owned detached copy under `.llm/tmp/`, change only the comparator expression
`right.score - left.score` to `left.score - right.score`, and run
`packages/mcp/tests/guidance-evaluation_test.ts`. The required result is exit 1 naming the
score-only row while the unmodified checkout passes. The scratch copy is never committed. Merely
asserting that the row has no concept is necessary but insufficient; both facts are recorded.

## Continuation test-first failure matrix (S4A–S5)

| Test | Failure class | Concrete pre-fix failure at `origin/main@51a58b4f5` |
| --- | --- | --- |
| Issue-paraphrase evaluation | Behavioral | `avoid hitting my service every render` activates no concept and ranks `pages/services-sdk/services#services-contracts` first; the required query section is not in the top five. |
| Getting-started evaluation | Behavioral | `create a new NetScript project from scratch` activates no concept and ranks `use-a-second-database#1-distinguishing-prismas-driver-adapter…` first; `llms#netscript` is second and `llms#getting-started` is not first. |
| Score-only evaluation discriminator | Behavioral | The current five-row suite still passes after the evaluator reverses the BM25 comparator because every row is route-hint-covered. The new zero-concept row does not exist and therefore cannot fail that mutation. |
| MCP initialize activation | Behavioral | `MCP_AGENT_INSTRUCTIONS` sends unfamiliar API discovery to export tools and docs only to hang troubleshooting; it never instructs `find_guidance` before unfamiliar implementation. |
| Generated `AGENTS.md` activation | Behavioral | `agentsSection()` names symptom `search_docs` and an offline start path but contains no unfamiliar-work `find_guidance` call. |
| Source and generated consumer-skill activation | Behavioral | `skills/netscript/SKILL.md` treats docs as general lookup, while `netscript-build` stops at `agent init --with-docs`; neither calls `find_guidance` before implementation. The generated skills barrel mirrors that absence. |
| Real installed-corpus stdio activation | Behavioral | `agent-mcp-stdio_test.ts` scaffolds a project, hand-writes one `workers.md`, and only checks that `find_guidance` is listed. It never runs `agent init --with-docs` or calls the tool against `.netscript/docs`, so `llms#task-router` cannot be observed on the public path. |
| Public docs activation contract | Behavioral | The three public docs describe the tool, but their workflow text does not consistently prescribe it as the pre-implementation step while preserving `search_docs`/`get_doc` roles. |

## Ordered continuation commit slices

The merged S1–S3 history remains authoritative. This PR owns only these new slices, each followed by
commit, explicit-refspec push, PR phase comment, and run-artifact update:

| Slice | Scope | Files | Proving gate |
| --- | --- | --- | --- |
| S4A | Close the two retrieval gaps and make score direction falsifiable without changing the locked five rows or ranking constants. | `packages/mcp/src/domain/docs/guidance-concepts.ts`; `packages/mcp/tests/fixtures/guidance-evaluation.json`; `packages/mcp/tests/guidance-evaluation_test.ts`; run artifacts | Focused evaluation passes eight rows identically and deterministically through embedded and materialized-filesystem adapters; the two new coverage rows hit their locked destinations; the score row asserts zero concepts; the scratch inverted-comparator run exits 1 on that row. Current 253,535-byte / 12-document assets remain byte-unchanged and below 262,144. |
| S4B | Activate the primary workflow through MCP initialization, generated project guidance, source consumer skills, and the actual no-AppHost CLI stdio route. | `packages/mcp/src/application/runner/mcp-server.ts`; MCP initialize tests; `packages/cli/src/public/features/agent/init/init-agent.ts`; `init-agent_test.ts`; `skills/netscript/SKILL.md`; `skills/netscript-build/SKILL.md`; `packages/cli/src/kernel/assets/skills.generated.ts`; `packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts`; run artifacts | Contract tests lock the activation sentence. The real CLI smoke scaffolds with `--no-aspire`, preinstalls the Playwright skill marker that makes Claude-host initialization skip Aspire delegation, runs public `agent init --host claude --editor none --with-docs`, starts public `agent mcp` with `.netscript/docs`, calls `find_guidance` for `build a real service-backed UI`, and receives rank-1 `llms#task-router`. It also checks installed `AGENTS.md` and generated skills contain the activation rule. |
| S5 | Align the published MCP and site guidance, regenerate owned assets, and collect all non-Aspire release evidence before requesting the serialized runtime token. | `packages/mcp/README.md`; `docs/site/reference/mcp/index.md`; `docs/site/ai/agent-tooling.md`; generator-owned publish/skill assets if source changes require them; run artifacts | Registry docs-drift proof, site build/render/link/caveat gates, root docs links/accuracy, package tests/static/fitness/publish gates, and review-thread gate. Only after these are recorded does worklog receive `EXPENSIVE-GATE-REQUEST`; push and stop for a durable owner grant. |

No retrieval corpus is regenerated for D13: the selected document paths and bytes do not change.
If implementation reveals that `llms#Getting started` cannot truthfully support the rank-one row,
that is plan drift requiring evaluator approval; it is not permission to add quickstart, increase the
cap, or drop another document.

## Foundation test-first failure matrix (implemented by merged #1404)

Every planned test has a real pre-fix red state:

| Test                                                                                 | Failure class                | Concrete pre-fix failure                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Registry/schema contract test for `find_guidance`                                    | Behavioral                   | `tools/list` has 21 tools and a call returns `tool_not_found`; no input/output schema exists.                                                                                                                                  |
| Public guidance type fixture                                                         | Compile-time                 | `DocsCorpusPort` has no guidance method and no stage/citation/code/link result types.                                                                                                                                          |
| Dual-adapter release-corpus evaluation (five rows, constrained top-3, repeatability) | Behavioral                   | Recorded current `search_docs` results miss four required destinations, do not rank sections, and the filesystem adapter cannot see root `llms.txt`.                                                                           |
| Concept mismatch row “avoid hitting my service every render”                         | Behavioral                   | Existing lexical search omits `web-layer/query` from the top five.                                                                                                                                                             |
| Section/code extraction fixtures                                                     | Compile-time then behavioral | `DocsSection` has no code/link fields; current parser returns section content only and cannot cite a code block independently.                                                                                                 |
| Vento `tabbedCode` fixture                                                           | Behavioral                   | Current parser treats the component source as undifferentiated body text; it emits no language/code record.                                                                                                                    |
| Internal-link prerequisite/next fixture                                              | Behavioral                   | Current parser emits no graph edges, so linked prerequisite/next sections cannot affect routing.                                                                                                                               |
| Filesystem/embedded parity on identical real release sources                         | Compile-time then behavioral | Neither adapter exposes guidance; filesystem discovery rejects `llms.txt`, while the current generator preserves its `.txt` suffix as embedded slug `llms.txt`, so neither can satisfy the shared `llms#task-router` contract. |
| Filesystem source-policy fixture (`llms.txt`, `llms-full.txt`, arbitrary `.txt`)     | Behavioral                   | Current walkers accept only `.md`: they reject root `llms.txt`; after widening, the negative controls must remain excluded.                                                                                                    |
| Bounds/low-confidence server test                                                    | Behavioral                   | The tool is unregistered, so no recommendation/code/link bounds or explicit fallback can be validated.                                                                                                                         |
| MCP initialize activation test                                                       | Behavioral                   | Current instructions mention docs only for hang troubleshooting and never request intent guidance before implementation.                                                                                                       |
| Generated `AGENTS.md` and bundled skill activation tests                             | Behavioral                   | Current generated prose routes only symptom search / generic docs lookup and contains no unfamiliar-work `find_guidance` instruction.                                                                                          |
| Real installed-corpus `agent mcp` stdio smoke                                        | Behavioral                   | It asserts 21 tools, manually writes one Markdown file instead of running `agent init --with-docs`, and sends no `find_guidance` call; the real installed filesystem path is unmeasured.                                       |
| Docs drift test                                                                      | Behavioral                   | README/reference/agent-tooling and tests are count-locked to 21 and contain no new tool contract.                                                                                                                              |

## Foundation commit slices (S1–S3 merged by #1404)

| #  | Slice and proof                                                                                                                                                                                                                                      | Files                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Proving gate                                                                                                                                                                                                                                           |
| -- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| S1 | Contract-first 22nd tool: domain types, Standard Schemas, registry metadata, flow shell, and red→green contract tests.                                                                                                                               | `packages/mcp/src/domain/docs/**` (move existing contract + new vocabulary), `packages/mcp/src/domain/tool-types.ts`, `packages/mcp/src/domain/tool-contracts.ts`, `packages/mcp/src/application/tool-registry.ts`, `packages/mcp/src/application/docs/find-guidance-flow.ts`, moved `docs-flows.ts`, `packages/mcp/mod.ts`, `packages/mcp/tests/guidance-contract_test.ts`, `registry_test.ts`, `stdio_test.ts`, run artifacts                                       | Focused Deno tests + scoped check; `tools/list` = 22 and malformed/oversized input is rejected.                                                                                                                                                        |
| S2 | One shared section index and source policy: concept aliases, normalized deterministic ranking, fenced/Vento examples, internal-link graph, stages/confidence/fallback, and filesystem admission/canonicalization for root `llms.txt`.                | `packages/mcp/src/domain/docs/guidance-concepts.ts`, `guidance-index.ts`, moved `docs-corpus-port.ts`, `packages/mcp/src/infrastructure/filesystem-docs-corpus.ts`, `embedded-docs-corpus.ts`, `packages/mcp/src/application/docs/docs-flows.ts`, `find-guidance-flow.ts`, `packages/mcp/cli.ts`, `packages/mcp/tests/guidance-retrieval_test.ts`, `packages/mcp/tests/docs-source-policy_test.ts`, focused fixtures, run artifacts                                   | Parser/ranker/flow tests; source-policy fixture accepts `.md` + root `llms.txt` as extensionless slugs and rejects `llms-full.txt`/arbitrary `.txt`; links change ordering; cited code and fallback are bounded.                                       |
| S3 | Real discriminator and fallback parity: refresh the stale canonical prose mirror, select issue-required pages, canonicalize generated `.md`/`.txt` slugs, check in constrained expected top-3, and run both adapters over byte-identical real files. | `.llm/assets/agent-docs/prose.json.gz`, `.llm/assets/agent-docs/provenance.json`, `packages/cli/src/kernel/assets/agent-docs.generated.ts`, `packages/mcp/tests/fixtures/guidance-evaluation.json`, `packages/mcp/tests/guidance-evaluation_test.ts`, `.llm/tools/generate-publish-assets.ts`, `.llm/tools/generate-publish-assets_test.ts`, `packages/mcp/src/publish-assets.generated.ts`, `packages/mcp/tests/release-embedded-docs-corpus_test.ts`, run artifacts | Provenance identifies current source; generator emits `llms` from `llms.txt`; all five evaluation rows—including `llms#task-router`—pass embedded and materialized-filesystem runs with equal results and deterministic reruns; budget/freshness pass. |

The continuation table above supersedes the old unimplemented S4/S5 rows without changing S1–S3.
Each continuation slice updates `worklog.md` and `context-pack.md`, commits, pushes by explicit
refspec, and receives one PR slice comment before the next. No product source is touched before a
fresh separate-session PLAN-EVAL `PASS`.

## Continuation validation plan

The order is cheapest first. Package-scoped commands are decisive for `packages/mcp`; root
`quality:gate` and `arch:check` remain non-decisive because #1403 documents their omissions.

| Order | Gate | Command / evidence | Required verdict |
| --- | --- | --- | --- |
| 1 | Focused retrieval/evaluation | `deno test --no-lock --allow-all packages/mcp/tests/guidance-evaluation_test.ts packages/mcp/tests/guidance-retrieval_test.ts packages/mcp/tests/docs-source-policy_test.ts packages/mcp/tests/release-embedded-docs-corpus_test.ts` | exit 0; eight evaluation rows; original five/15 unchanged; embedded/materialized equality; render symptom, getting-started, and score-only constraints pass. |
| 2 | Score mutation control | Owned detached scratch copy; invert only `right.score - left.score`; rerun `guidance-evaluation_test.ts` | exit 1 and the new score-only row fails. The clean committed checkout immediately reruns exit 0. |
| 3 | Full MCP package | `deno test --no-lock --allow-all packages/mcp/tests/` | exit 0; no skipped test. |
| 4 | CLI pair / real installed stdio | `deno test --no-lock --allow-all packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts packages/cli/src/public/features/agent/init/init-agent_test.ts` | exit 0; public no-Aspire `agent init --with-docs` → `.netscript/docs` → `agent mcp` → `find_guidance`; rank 1 is `llms#task-router`. |
| 5 | Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/mcp --root packages/cli/src/public/features/agent --file packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts --file packages/cli/src/kernel/assets/skills.generated.ts --ext ts,tsx --deno-arg --no-lock --pretty` | exit 0, selected files greater than zero; wrapper supplies `--unstable-kv`. |
| 6 | Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/mcp --root packages/cli/src/public/features/agent --file packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts --file packages/cli/src/kernel/assets/skills.generated.ts --ext ts,tsx --config packages/mcp/deno.json --pretty` | exit 0. |
| 7 | Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/mcp --root packages/cli/src/public/features/agent --file packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts --file packages/cli/src/kernel/assets/skills.generated.ts --ext ts,tsx --config packages/mcp/deno.json --pretty` | exit 0. |
| 8 | Decisive MCP code quality | `deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/mcp/src --pretty` | exit 0, zero findings and zero allowances; no `any`, escape cast, lint ignore, or `quality-allow`. |
| 9 | Decisive MCP doctrine inventory | `deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/mcp` | Record raw exit. Baseline at `51a58b4f5` is exit 1 with exactly A14 fail + three warnings + one info; post-change output must add/deepen zero findings. These pre-existing findings remain #1403 triage and are never called green. |
| 10 | Aggregate framework checks, non-decisive | `rtk proxy deno task quality:gate`; `rtk proxy deno task arch:check` | raw exits and `skipped=` recorded; explicitly not package evidence. |
| 11 | Generated assets and JSR specifiers | `rtk proxy deno task check:publish-assets`; `rtk proxy deno task check:assets-barrel`; `rtk proxy deno task check:netscript-jsr-specifiers` | each exit 0; JSR output says `failures=0`; generated mirrors reproduce source. |
| 12 | Docs drift and site integrity | MCP `registry_test.ts`; `rtk proxy deno task --cwd docs/site verify`; `rtk proxy deno task docs:links`; `rtk proxy deno task docs:accuracy` | each exit 0; required `templateEngine` front matter remains; source/render guards, links, caveats, names/counts, and examples agree. |
| 13 | JSR package audit | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/mcp --text` | raw exit 0 and no new finding. Baseline is cardinality 14/16 plus slow-types banner. |
| 14 | Full-export doc lint | `rtk proxy deno task doc:lint --root packages/mcp --pretty` | exit 0, combined diagnostics 0 over `.`, `./cli`, and `./openapi-projection`. |
| 15 | Publish surfaces | `rtk proxy deno task --cwd packages/mcp publish:dry-run`; `rtk proxy deno task publish:dry-run` | each raw exit 0; published README/generated skills import graph is accepted. |
| 16 | Review threads | `rtk proxy deno task agentic:review-threads -- --repo rickylabs/netscript --pr <n> --pretty` | exit 0 before evaluator handoff. |
| 17 | Serialized merge readiness | Only after orders 1–16: append/push `EXPENSIVE-GATE-REQUEST` and stop. After a durable grant: pre-leak-check → exact `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` → post-leak-check. | Only the exact one-pass run is decisive; raw exit 0, no skipped decisive gate, and leak artifacts reviewed. |

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
| Broadening `.txt` discovery indexes giant/private text files       | Admit exactly root-relative `llms.txt`; reject `llms-full.txt`, nested/arbitrary `.txt`, and underscore/excluded paths in async and sync walker tests.                     |
| New aliases merely memorize one sentence | Include a small render/request phrase family, keep the existing required `cache` corpus term, and lock the issue paraphrase as an external fixture rather than a special case in the scorer. |
| Getting-started route is too thin without the full quickstart | Require a cited `llms#Getting started` excerpt and rank-one test. If it is not sufficient, return to evaluator; do not silently raise the cap or replace a document. |
| Score row accidentally activates a route hint later | Fixture metadata marks the row score-only and the test asserts zero activated concepts before checking top three; scratch comparator inversion must fail it. |
| Real CLI smoke accidentally starts Aspire | Scaffold with `--no-aspire`, install the existing Playwright skill marker, then invoke public `agent init` for host `claude` with editor `none`; the initializer's tested guard skips Aspire delegation while still installing Claude skills and root `AGENTS.md`. No `e2e:cli`, AppHost, or container is permitted in S4B. |
| Docs edit regresses recent source/render guards | Preserve `templateEngine` and exact JSR specifiers; run the site `verify` build plus root docs links/accuracy and the JSR specifier guard. No allowance or bypass is permitted. |
| Known doctrine failure is presented as a pass | Record raw exit 1 and exact baseline/post finding inventory; require zero delta and leave the existing rows to #1403/debt triage. |
| Public contract grows an already large surface                     | Export only consumer-relevant guidance types/functions; doc-lint all export subpaths.                                                                                      |
| Existing cardinality/slow-type warnings are misclaimed             | Record baseline; folder moves improve/do not deepen; no closure claim without gate evidence.                                                                               |
| Response truncation destroys schema                                | Apply per-field/per-array bounds inside the flow below central truncation and validate post-truncation schemas.                                                            |
| Task router is copied and drifts                                   | Index `llms#task-router`; never duplicate its prose or generator.                                                                                                          |
| Evaluation is mistaken for adoption                                | PR and issue evidence state retrieval-quality only; #1090 remains the sole adoption experiment.                                                                            |

## Acceptance evidence map and close gate

| Live issue row | Required continuation evidence before checking it |
| --- | --- |
| Ordered section guidance + cited code | Full MCP suite retains the merged contract/parser/code-citation tests; public stdio returns an ordered recommendation with `slug#section`. |
| Checked-in deterministic top-k | Eight-row fixture passes twice per adapter; original five rows / 15 citations unchanged; scratch score inversion fails the added score row. |
| Concept mismatch | Exact issue paraphrase ranks cache-first query guidance without a NetScript symbol in the intent; getting-started natural language ranks `llms#getting-started`. |
| Internal links route prerequisite/next | Existing focused link-order tests remain green in the full/focused package gates. |
| Filesystem/embedded parity and bounds | All eight rows are byte-equal across embedded and materialized filesystem; public installed filesystem returns `llms#task-router`; bounds tests remain green. |
| Instructions/generated guidance activate flow | MCP initialize response, generated `AGENTS.md`, source skills, generated skill asset, public docs, and real stdio test all contain/exercise the unfamiliar-work rule. |
| Adoption only in #1090 | PR/run records make no usage claim and do not edit/tick #1090. |

Only after every row above has evidence, non-Aspire gates have the recorded verdicts, the granted
serialized runtime gate passes, and separate IMPL-EVAL passes may the PR body change `Refs #1102`
to `Closes #1102`. The implementation supervisor does not mark ready or self-certify.

## Open-decision sweep

| Decision                                              | Status                         | Notes                                                                                                                                                            |
| ----------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact evaluation destinations                         | Resolved                       | Original five rows / 15 citations stay immutable; three additive rows and their constraints are locked above. PLAN-EVAL must reject unsupported rows.           |
| Numeric BM25/boost constants                          | Resolved                       | `worklog.md` locks BM25 k1/b and every boost; no tuning after reading expected output without drift.                                                             |
| Maximum recommendations/excerpts/links/string lengths | Resolved                       | `worklog.md` locks every collection and string bound; schema and flow share these constants.                                                                     |
| Cross-adapter `llms.txt` source policy                | Resolved                       | D12 locks filesystem admission, embedded generator canonicalization, extensionless slug, negative controls, dual-adapter evaluation, and installed-corpus smoke. |
| Additional aliases / getting-started concept          | Resolved                       | D13/D14 add only cases justified by checked-in natural-language failures; no ranking-constant change.                                                            |
| Quickstart page vs byte cap                           | Resolved                       | Keep 12 docs / 262,144 cap and route through `llms#Getting started`; measured alternatives are recorded in research.                                             |
| Embeddings/local model                                | Safe to defer                  | Offline deterministic lexical hybrid satisfies this issue if evaluation passes.                                                                                  |
| Observed adoption                                     | Safe to defer, owned elsewhere | #1090 only.                                                                                                                                                      |

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
- Any filesystem/embedded disagreement on `llms#task-router`, or admission of text files other than
  root `llms.txt`.
- Any gate that silently skips guidance tests or omits `packages/mcp`.
- Any claim that the evaluation demonstrates real agent adoption.
