# Worklog: #1102 intent-aware capability discovery

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `release-0.0.5--orchestration/slices/w3-b1-1102` |
| Branch         | `fix/mcp-intent-aware-discovery`                 |
| Archetype      | `6 — CLI / Tooling`                              |
| Scope overlays | `docs`                                           |

## Design

### Public Surface

- MCP tool `find_guidance` — read-only input `{ intent: string; limit?: 1..8 }`.
- `DocsCorpusPort.findGuidance(intent)` — the single shared corpus capability composed by both
  adapters; `search` and `get` remain unchanged.
- Public types: `GuidanceStage`, `GuidanceConfidence`, `GuidanceLinkRelation`,
  `GuidanceSectionCitation`, `GuidanceCodeExcerpt`, `GuidanceRecommendation`, and `GuidanceResult`.
- `createFindGuidanceFlow` — validates input, calls the corpus, and applies output limits before the
  central MCP truncator.
- No new export subpath or CLI verb.

### Domain Vocabulary

- `GuidanceStage` — `prerequisite | implementation | verification`.
- `GuidanceConfidence` — `high | medium | low`.
- `GuidanceLinkRelation` — `prerequisite | next | related`.
- `GuidanceSectionCitation` — stable `{ slug, section, heading }` source identity.
- `GuidanceCodeExcerpt` — `{ language, code, source }`, never an uncited raw fence.
- `GuidanceRecommendation` — ordered stage + section citation + why/excerpt/code.
- `GuidanceResult` — bounded recommendations, related routes, confidence/fallback, truncation flag.
- `GuidanceConcept` — finite alias/phrase group used to bridge natural language to corpus
  vocabulary.
- `GuidanceLinkEdge` — normalized one-hop internal document/fragment relation.

### Ports

- Extend the existing `DocsCorpusPort`; do not add another filesystem/embedded port.
- Filesystem remains the only file/mtime/realpath edge. Embedded remains in-memory. The shared
  parser/index/ranker is pure domain policy.

### Constants

- `GUIDANCE_STAGES` — `prerequisite`, `implementation`, `verification`.
- `GUIDANCE_CONFIDENCE_LEVELS` — `high`, `medium`, `low`.
- `GUIDANCE_LINK_RELATIONS` — `prerequisite`, `next`, `related`.
- `GUIDANCE_MAX_RECOMMENDATIONS = 8`; default `5`.
- `GUIDANCE_MAX_CODE_EXCERPTS_PER_RECOMMENDATION = 2`.
- `GUIDANCE_MAX_RELATED_LINKS = 8`.
- `GUIDANCE_MAX_EXCERPT_CHARACTERS = 600`.
- `GUIDANCE_MAX_CODE_CHARACTERS = 1_600`.
- `GUIDANCE_MAX_WHY_CHARACTERS = 240`; fallback `320`.
- `GUIDANCE_GRAPH_DEPTH = 1`.
- Ranking constants will be one named frozen policy object: BM25 `k1 = 1.2`, `b = 0.75`; title boost
  `4`, heading boost `6`, exact phrase boost `10`, curated-concept boost `8`, link boost `2`. The
  policy is locked before implementation; changing it after evaluation output is observed is drift.

### Archetype-6 checkpoint

- Existing MCP entry/composition: `packages/mcp/cli.ts` and `createMcpCliServer` own wiring.
- Existing public CLI command: `packages/cli/src/public/features/agent/mcp/agent-mcp-command.ts`; no
  command vocabulary changes.
- Five A6 CLI spine abstracts belong to `@netscript/cli` and are not changed by this package slice.
- No new layer-2 abstract, registry, extension axis, process/HTTP adapter, permission, template, or
  generated scaffold file is introduced.
- Vertical feature grouping: docs flows move from the flat `application/flows` folder to
  `application/docs`; docs domain moves into `domain/docs` to avoid cardinality deepening.
- Composition declarativity: `createMcpCliServer` only constructs the selected corpus and spreads
  its flow map; ranking and parsing remain outside `cli.ts`.

### Commit Slices

| # | Slice                                                                                                | Gate                                                          | Files                                                                                                                |
| - | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1 | Public `find_guidance` contract and enumerable flow                                                  | focused contract/registry/stdio tests + scoped check          | MCP domain/contracts/registry/docs flow/mod/tests + run artifacts                                                    |
| 2 | Shared section index, aliases, code and link routing                                                 | guidance retrieval unit tests                                 | MCP docs domain/application/adapters/CLI composition/tests + run artifacts                                           |
| 3 | Approved canonical prose refresh, actual release-corpus top-3 evaluation, and embedded parity/budget | provenance/evaluation/parity tests + `check:publish-assets`   | checked-in prose/provenance, evaluation JSON/tests, publish generator/tests/generated CLI/MCP assets + run artifacts |
| 4 | Primary-workflow activation in MCP and generated agents                                              | initialize/init/asset tests + real CLI stdio smoke            | server instructions, agent init/tests, source skills/generated skill barrel, CLI e2e + run artifacts                 |
| 5 | Public docs and full validation handoff                                                              | package/docs/publish gates; serialized smoke only after grant | MCP/site docs, generated owned assets, run artifacts                                                                 |

### Deferred Scope

- Embeddings/model retrieval — unnecessary unless deterministic evaluation fails for a reason
  aliases and section ranking cannot address.
- Multi-hop graph search — bounded one-hop routing is the issue contract.
- Adoption/usage — #1090 only.
- Corpus-root plumbing or command execution identity — already delivered by #1375/#1376.

### Contributor Path

To add a supported intent, add a natural-language row and independent expected destinations to the
evaluation JSON first. If existing scoring fails, extend the finite concept table in
`src/domain/docs/guidance-concepts.ts`; do not add query-specific branches to the flow. To add a
parser form, add a minimal source fixture plus its expected section/code/link record, then change
the single shared indexer used by both adapters.

## Progress Log

| Time       | Slice | Step              | Notes                                                                                                                                                                           |
| ---------- | ----- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-09 | Plan  | Research          | Read live #1102, dependencies #1375/#1376, current contracts/adapters/docs/generator/gates, doctrine, harness, and JSR surface.                                                 |
| 2026-08-09 | Plan  | Pre-fix evidence  | Recorded six natural-language lexical-search outputs; four issue targets and the extra concept-mismatch target miss top-five expectations.                                      |
| 2026-08-09 | Plan  | Corpus finding    | Proved the checked-in prose mirror predates the current unsupported-driver section; locked refresh through the approved mirror/compressed-prose generators before selection.    |
| 2026-08-09 | Plan  | Draft PR          | Opened draft PR #1404 against `main`; applied milestone `0.0.5`, feature/docs/tooling/JSR/p1 taxonomy, and exactly `status:plan-eval`; posted RESEARCH and PLAN phase comments. |
| 2026-08-09 | Plan  | Plan-Gate handoff | Plan/design ready; product implementation is stopped pending separate-session PLAN-EVAL PASS.                                                                                   |

## Gate Results

| Gate                         | Result                      | Evidence / note                                                             |
| ---------------------------- | --------------------------- | --------------------------------------------------------------------------- |
| Git baseline                 | PASS                        | clean `fix/mcp-intent-aware-discovery` at `3f41a3639` before plan artifacts |
| JSR audit baseline           | PASS with existing warnings | exit 0; cardinality 14/16 and slow-types banner recorded in research        |
| MCP doc-lint baseline        | PASS                        | exit 0; combined diagnostics 0 over all three exports                       |
| MCP publish dry-run baseline | PASS                        | exit 0; dry run complete                                                    |
| PLAN-EVAL                    | NOT_RUN                     | mandatory separate Claude · Fable 5 session; orchestrator must launch       |
| Implementation gates         | NOT_RUN                     | prohibited before PLAN-EVAL PASS                                            |
| Aspire/container gates       | NOT_RUN                     | no token requested; no AppHost/container started                            |

## Handoff Notes

- Open `research.md` F1–F11 and spot-check the cited source before trusting the plan.
- Challenge the 15 exact evaluation destinations locked in `plan.md` before S2. A weak choice is a
  plan defect, not something to tune around later.
- Verify every test in the failure matrix has the stated behavioral or compile-time pre-fix red.
- Treat root `quality:gate`/`arch:check` as non-decisive for MCP; require explicit package roots.
- Do not interpret retrieval evaluation as #1090 adoption evidence.
