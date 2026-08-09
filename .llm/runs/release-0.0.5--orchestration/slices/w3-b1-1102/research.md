# Research — #1102 intent-aware capability discovery

## Re-baseline

- Carried-in source: issue #1102 and the W3-B1 slice brief.
- Re-derived against `origin/main@3f41a3639` on 2026-08-09; worktree was clean.
- Dependencies verified in the tree:
  - `9fabd5286` supplies flag → environment → project probe → generated embedded docs selection,
    observable `list_docs.corpus`, release provenance, and the `262_144`-byte generator budget.
  - `3f41a3639` supplies truthful host-CLI identity and receipt wrapping for `list_commands` and
    `execute_command`.
- Neither dependency is reimplemented. The plan extends the one generator-owned embedded selection
  and the one existing docs corpus/index path.

## Live acceptance contract (quoted from issue #1102)

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

The last row is a scope boundary, not adoption evidence for this PR. The deterministic retrieval
evaluation cannot satisfy any #1090 experimental acceptance row.

## Findings

| #   | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | How to verify                                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | The current docs contract is document-oriented: sections contain heading/slug/level/content, search matches contain only document slug/title/snippet/score, and the port has only `list`, `search`, and `get`. It has no code-excerpt, link-edge, guidance-stage, confidence, or fallback contract.                                                                                                                                                                                                                            | `packages/mcp/src/domain/docs-corpus-port.ts:21-72`                                                                                                                                                      |
| F2  | Both adapters already share parsing and lexical ranking through `processDocsSources` / `rankDocument`; embedded imports those functions from the filesystem adapter. A second retrieval path would duplicate the dependency slice instead of building on it.                                                                                                                                                                                                                                                                   | `packages/mcp/src/infrastructure/filesystem-docs-corpus.ts:184-356`; `packages/mcp/src/infrastructure/embedded-docs-corpus.ts:8-71`                                                                      |
| F3  | Current ranking is flat whole-document occurrence counting (title ×12, headings ×5, body ×1) and returns one body-adjacent snippet. `parseSections` retains section text but does not parse Markdown/Vento code examples or internal links.                                                                                                                                                                                                                                                                                    | `packages/mcp/src/infrastructure/filesystem-docs-corpus.ts:308-356`                                                                                                                                      |
| F4  | The live baseline is a discriminator, not a green-by-construction fixture. Existing search ranks `reference/*` noise first for four issue intents; “avoid hitting my service every render” does not return `web-layer/query` in its top five.                                                                                                                                                                                                                                                                                  | Run the checked-in `pre-fix-query-sweep.ts` command below; exact results are listed below.                                                                                                               |
| F5  | The generated fallback currently selects five golden-path pages (79,292 source bytes) and omits `llms.txt`, forms, query/cache, custom-plugin, and unsupported-driver destinations. More importantly, the checked-in compressed prose mirror is stale: current site source has `Unsupported by NetScript, supported by Prisma (libSQL / Turso example)`, while the mirror's same document stops at the older external-database guidance. That destination cannot honestly be selected until the canonical mirror is refreshed. | `.llm/tools/generate-publish-assets.ts:12-21`; `docs/site/data-persistence/how-to/use-a-second-database.md:245`; inspect `.llm/assets/agent-docs/prose.json.gz` with `DecompressionStream`               |
| F12 | An approved refresh path already exists: `/home/codex/repos/.briefing/build-docs-bundle.sh` builds/mirrors the site and records source provenance; `.llm/tools/docs/build-agent-docs-bundle.ts` accepts only that bundle shape and regenerates `.llm/assets/agent-docs/{prose.json.gz,provenance.json}`. Reusing it is a source refresh for #1375's existing path, not a second corpus implementation.                                                                                                                         | Open both scripts; the shell builder validates built-site version/task-router and writes `MANIFEST.md`, while the Deno builder validates that manifest/task-router and writes the two checked-in assets. |
| F13 | The planned 13-document selection is projected at 243,222 source bytes: 236,997 bytes using the current mirror plus the 6,225-byte current-source growth of the second-database page. That leaves 18,922 bytes below the 262,144 cap, but the post-build generator—not this estimate—is the decisive budget verdict.                                                                                                                                                                                                           | Decompress the current prose and sum the 13 selected paths; compare current/mirrored second-database byte counts; rerun `buildMcpEmbeddedDocs` after the canonical refresh.                              |
| F14 | The primary installed filesystem corpus cannot currently address the planned `llms#task-router`: async and sync walkers admit only `.md`; `normalizeSlug` strips only `.md`; meanwhile `docsSlugFromPath('llms.txt')` currently returns `llms.txt` for the embedded selection. A parity test that does not exercise the `llms` row can therefore pass while `agent init --with-docs` remains broken.                                                                                                                           | `packages/mcp/src/infrastructure/filesystem-docs-corpus.ts:137,177,380-388`; `.llm/tools/generate-publish-assets.ts:224-226`; `packages/cli/src/public/features/agent/init/init-agent_test.ts:655-678`   |
| F6  | The #1068 task router is already generated into `llms.txt`, and both the bundle builder and CLI docs generator fail if it is absent. It should be indexed as input, not copied into a new router.                                                                                                                                                                                                                                                                                                                              | `docs/site/_plugins/ai-tooling.ts:468-480`; `.llm/tools/docs/build-agent-docs-bundle.ts:70-72`; `packages/cli/src/public/adapters/agent/deno-agent-docs-generator.ts:141-143`                            |
| F7  | Activation is symptom-only today: MCP instructions route `search_docs` only for hangs, while generated `AGENTS.md` text does the same. The bundled NetScript router skill describes docs as an observation/search loop, not a pre-implementation intent step.                                                                                                                                                                                                                                                                  | `packages/mcp/src/application/runner/mcp-server.ts:24-25`; `packages/cli/src/public/features/agent/init/init-agent.ts:25-32`; `skills/netscript/SKILL.md`                                                |
| F8  | The public MCP schema, registry, docs, and real CLI stdio smoke are count-locked at 21 tools. A new tool must update all of them coherently.                                                                                                                                                                                                                                                                                                                                                                                   | `packages/mcp/src/domain/tool-types.ts:4-26`; `packages/mcp/tests/stdio_test.ts:44`; `packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts:128`; `packages/mcp/tests/registry_test.ts`                   |
| F9  | `quality:gate` is not decisive for this slice: `quality:scan` defaults to `packages/cli/src` + `plugins`, while root `arch:check` names selected roots and omits `packages/mcp`. Explicit package-root scanner and doctrine commands are required.                                                                                                                                                                                                                                                                             | `.llm/tools/quality/scan-code-quality.ts:18`; root `deno.json` tasks `quality:gate` and `arch:check`; issue #1403                                                                                        |
| F10 | The published `@netscript/mcp` surface is currently dry-run clean and full-export doc-lint clean, but the JSR audit reports existing cardinality warnings for `src/domain` (14) and `src/application/flows` (16), plus one slow-types banner warning. New structure must not deepen those counts.                                                                                                                                                                                                                              | `audit-jsr-package.ts --root packages/mcp --text`; `deno task doc:lint --root packages/mcp --pretty`; `deno task --cwd packages/mcp publish:dry-run` (all run 2026-08-09, exit 0)                        |
| F11 | The current doctrine verdict table does not list `@netscript/mcp`; because it ships `cli.ts` and a user-run MCP stdio tool surface, this run applies Archetype 6 rather than inventing a package verdict. No existing `packages/mcp` debt entry was found.                                                                                                                                                                                                                                                                     | `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:9-57`; `packages/mcp/deno.json`; `.llm/harness/debt/arch-debt.md`                                                                         |

### Recorded pre-fix query sweep

Reproduction command (run from repository root, exit 0 on 2026-08-09):

```sh
deno run --no-lock --unstable-kv --allow-read \
  .llm/runs/release-0.0.5--orchestration/slices/w3-b1-1102/pre-fix-query-sweep.ts
```

The checked-in script imports the production `FilesystemDocsCorpus`, points it at `docs/site`, runs
the six literal intents below, and emits each top five as JSON; it is not a ranker replica.

| Intent                                                  | Current top results                                                               | Required destination status                                  |
| ------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| validated route-bound form                              | `reference/fresh`, `web-layer/form`, `web-layer/route`                            | target is only second and not section-ranked                 |
| keep server data fresh without polling                  | `reference/fresh`, second-database docs, database docs, server docs, query bridge | `web-layer/query` / cache-first chapter absent from top five |
| add a capability NetScript does not ship                | workers/fresh/sagas/aspire/telemetry references                                   | custom-plugin guide absent from top five                     |
| use a Prisma-supported database NetScript does not wrap | workers/fresh/sagas/aspire/database                                               | unsupported-driver section absent from top five              |
| build a real service-backed UI                          | workers/fresh/sagas/aspire/telemetry references                                   | #1068 task-router sequence absent from top five              |
| avoid hitting my service every render                   | discover-services/services/add-service/reference-sdk/aspire                       | query-cache page absent from top five                        |

## JSR-audit surface scan

- Surface scanned: all three exports from `packages/mcp/deno.json` (`.`, `./cli`,
  `./openapi-projection`) with `deno doc`, structured doc-lint, the package audit, and package
  dry-run.
- Baseline: package dry-run exit 0; structured doc-lint reports combined total 0.
- Existing risks to preserve, not claim as created or fixed:
  - cardinality warnings at `src/domain` (14) and `src/application/flows` (16);
  - audit reports one slow-types banner warning although the package dry-run exits 0;
  - the default surface already has 60 symbols, so new public exports must be the minimum contract
    needed by embedders and must stay documented.
- Planned mitigation: group the docs domain under `src/domain/docs/` (moving the existing contract,
  not adding a 15th root child), group docs flows under `src/application/docs/` (reducing the
  overloaded `flows/` root), export only stable guidance contracts/functions actually needed by the
  CLI composition, and rerun full-export doc-lint plus package dry-run.

## Open questions resolved by the plan

- Tool name: lock `find_guidance`; it is task-oriented and distinct from literal `search_docs`.
- Retrieval: lock deterministic section-level BM25-style scoring plus finite curated concept
  aliases, phrase boosts, and one-hop internal-link traversal; no network or local embedding model.
- Corpus: first refresh #1375's canonical checked-in prose through the existing approved builder
  chain, then extend its generated selection; do not create a parallel fallback path.
- Source parity: admit root `llms.txt` in the filesystem adapter, canonicalize it to `llms` in both
  filesystem and generated embedded inputs, and explicitly exclude `llms-full.txt`/other text.
- Evaluation: use the actual generated release documents plus a checked-in expected-results JSON
  against both adapters; synthetic fixtures cover parser edges only and cannot satisfy
  retrieval-quality acceptance.
- Adoption: defer entirely to #1090.
