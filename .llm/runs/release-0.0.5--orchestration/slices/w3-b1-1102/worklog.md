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
- Filesystem source discovery admits public `.md` plus root-relative `llms.txt` only; both
  filesystem slug normalization and the embedded publish generator strip `.md`/`.txt` so the shared
  index sees `llms`. `llms-full.txt` and arbitrary/nested `.txt` remain excluded.

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

| # | Slice                                                                                             | Gate                                                           | Files                                                                                                                |
| - | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1 | Public `find_guidance` contract and enumerable flow                                               | focused contract/registry/stdio tests + scoped check           | MCP domain/contracts/registry/docs flow/mod/tests + run artifacts                                                    |
| 2 | Shared section index, aliases, code/link routing, and root `llms.txt` filesystem policy           | guidance/source-policy unit tests                              | MCP docs domain/application/adapters/CLI composition/tests + run artifacts                                           |
| 3 | Approved canonical prose refresh, dual-adapter release-corpus top-3 evaluation, and parity/budget | provenance/evaluation/parity tests + `check:publish-assets`    | checked-in prose/provenance, evaluation JSON/tests, publish generator/tests/generated CLI/MCP assets + run artifacts |
| 4 | Primary-workflow activation in MCP and generated agents                                           | initialize/init/asset tests + installed-corpus CLI stdio smoke | server instructions, agent init/tests, source skills/generated skill barrel, CLI e2e + run artifacts                 |
| 5 | Public docs and full validation handoff                                                           | package/docs/publish gates; serialized smoke only after grant  | MCP/site docs, generated owned assets, run artifacts                                                                 |

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

| Time       | Slice | Step              | Notes                                                                                                                                                                                                                                                                                                              |
| ---------- | ----- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-08-09 | Plan  | Research          | Read live #1102, dependencies #1375/#1376, current contracts/adapters/docs/generator/gates, doctrine, harness, and JSR surface.                                                                                                                                                                                    |
| 2026-08-09 | Plan  | Pre-fix evidence  | Recorded six natural-language lexical-search outputs; four issue targets and the extra concept-mismatch target miss top-five expectations.                                                                                                                                                                         |
| 2026-08-09 | Plan  | Corpus finding    | Proved the checked-in prose mirror predates the current unsupported-driver section; locked refresh through the approved mirror/compressed-prose generators before selection.                                                                                                                                       |
| 2026-08-09 | Plan  | Draft PR          | Opened draft PR #1404 against `main`; applied milestone `0.0.5`, feature/docs/tooling/JSR/p1 taxonomy, and exactly `status:plan-eval`; posted RESEARCH and PLAN phase comments.                                                                                                                                    |
| 2026-08-09 | Plan  | Plan-Gate handoff | Plan/design ready; product implementation is stopped pending separate-session PLAN-EVAL PASS.                                                                                                                                                                                                                      |
| 2026-08-09 | Plan  | PLAN-EVAL cycle 1 | `FAIL_PLAN`: filesystem excludes `llms.txt`; F4 lacked a checked-in reproduction command; Prisma nested order was overconstrained. Full evaluator file was not present locally or on the fetched PR branch, so this records the orchestrator-delivered verdict without fabricating the missing evaluator artifact. |
| 2026-08-09 | Plan  | Cycle-2 repair    | Commit `271428de5`: locked D12 across both adapters, dual-adapter plus installed-corpus gates, checked in/reran the real F4 sweep, and changed Prisma to an unordered required top-three set. Product source remains untouched.                                                                                    |
| 2026-08-09 | Plan  | PLAN-EVAL cycle 2 | `PASS` from a fresh separate Claude · Fable 5 session; implementation authorized with D12, three-path `llms` proof, package-scoped decisive gates, and serialized AppHost/container token conditions binding.                                                                                                    |
| 2026-08-09 | S1    | Contract          | Added the 22nd read-only `find_guidance` tool, finite public guidance vocabulary, strict Standard Schemas, bounded flow shell, vertical docs domain/application folders, and synchronized count references. Retrieval and corpus admission remain S2.                                                          |
| 2026-08-09 | S1    | Proof             | Focused MCP tests: 28 passed / 0 failed; CLI/init tests: 20 passed / 0 failed; scoped MCP check selected 108 files with 0 failed batches; scoped lint/fmt and `check:publish-assets` each exit 0. The first lint invocation without package config failed before linting because Deno 2.9 rejected the root workspace shape; rerun with `--config packages/mcp/deno.json` was decisive and green. |
| 2026-08-09 | S2    | Retrieval         | Extended the one `DocsCorpusPort`; both adapters use the same immutable section parser/index/ranker with locked BM25/boost constants, finite concepts, fenced/Vento code citations, deterministic ties, bounded fallback, and direct one-hop link routing. A link-removal control proves prerequisite routing changes rank. |
| 2026-08-09 | S2    | D12 policy        | Async/sync filesystem discovery now admits public `.md` plus only root-relative `llms.txt`, canonicalized through the same `.md`/`.txt` normalizer used by embedded inputs. Tests reject `llms-full.txt`, nested `config.txt`, nested `llms.txt`, and arbitrary text. This intentionally increases `list_docs.corpus.documentCount` by one when root `llms.txt` exists. Generator parity remains S3. |
| 2026-08-09 | S2    | Proof             | Full MCP package: 131 passed / 0 failed; focused source/retrieval group: 29 passed / 0 failed; scoped check/lint/fmt selected 114 files with zero failures/findings. Explicit package-source quality exit 0, zero findings/allowances. Explicit doctrine exit 1 only for #1403's pre-existing A14 failure plus three existing warnings/info; a transient new 410-line warning was eliminated before commit by splitting parser/ranker/result files. |
| 2026-08-09 | S3    | Corpus blocker    | Approved mirror builder exited 1 before producing artifacts: current `database-migration.md:46` contains a pre-existing multiline quoted Vento `desc` introduced by `2f64cc0011`, causing an unterminated string. Current main remains `3ce91f2c2`; existing briefing bundle is stale and lacks the required Prisma section. Reported rather than creating a second or falsely provenanced path. |
| 2026-08-09 | S3    | Canonical refresh | Rebased without a merge onto `main@399f60185`. The approved builder ran from a fresh detached exact-revision checkout to a fresh output directory, exited 0, reported 170 pages / 36 deno-doc packages, and emitted provenance `399f60185`. Its second-database mirror contains the unsupported-Prisma heading plus application-owned and decision-rule child sections. No `docs/site/**` source was edited. |
| 2026-08-09 | S3    | Budget drift      | The unchanged 13-document plan now measures 274,497 bytes because current sources beyond Prisma also grew. Preserved the 262,144 cap and all eight issue-required additions; removed only the prior generic quickstart page (no locked citation). Generated fallback is 253,511 bytes / 12 documents, +174,219 bytes and +7 net documents from the previous 79,292-byte / 5-document asset. |
| 2026-08-09 | S3    | Evaluation        | Checked in five independent intents and 15 locked citations. Four rows assert exact ordered top three; Prisma asserts the unchanged unordered required set. Each row passes repeatably and byte-equally through generated embedded sources and a materialized filesystem corpus, including `llms#task-router`. Curated semantic heading/title routes are shared ranker policy, not adapter/query branches. |
| 2026-08-09 | Eval  | IMPL-EVAL cycle 1 | `FAIL_FIX` at `fd9267906`: the intended D12 installed-corpus count changed from 2 to 3, but the exact CLI consumer assertion remained stale because S2/S3 did not rerun the CLI pair. The evaluator also required the deepened A8 file-size debt and retrieval-evidence limitations to be recorded. |
| 2026-08-09 | Eval  | Repair            | Kept production behavior unchanged and corrected the exact installed registry assertion to three ordered rows (`llms`, `MANIFEST`, `pages/services-sdk/services`). The focused pre-fix test exited 1; the mandated two-file CLI run then exited 0 with 20 passed / 0 failed. Recorded the 301 → 367 line A8 debt and explicitly narrowed S3 evidence to curated routing/corpus/parity rather than BM25 scoring. |

## Gate Results

| Gate                         | Result                      | Evidence / note                                                                                         |
| ---------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------- |
| Git baseline                 | PASS                        | clean `fix/mcp-intent-aware-discovery` at `3f41a3639` before plan artifacts                             |
| JSR audit baseline           | PASS with existing warnings | exit 0; cardinality 14/16 and slow-types banner recorded in research                                    |
| MCP doc-lint baseline        | PASS                        | exit 0; combined diagnostics 0 over all three exports                                                   |
| MCP publish dry-run baseline | PASS                        | exit 0; dry run complete                                                                                |
| PLAN-EVAL cycle 1            | FAIL_PLAN                   | separate Claude · Fable 5 verdict delivered by orchestrator; M1 + two minors repaired in plan artifacts |
| PLAN-EVAL cycle 2            | PASS                        | separate Claude · Fable 5 verdict posted by orchestrator to PR #1404                                    |
| S1 focused MCP tests         | PASS                        | exit 0; 28 passed, 0 failed across guidance contract, registry, stdio, and docs tests                     |
| S1 CLI/init tests            | PASS                        | exit 0; 20 passed, 0 failed; no AppHost or container started                                             |
| S1 scoped MCP check          | PASS                        | exit 0; 108 selected files, 0 failed batches, `--no-lock`                                                |
| S1 scoped MCP lint / format  | PASS                        | exit 0 with package config; 108 files, 0 findings                                                        |
| S1 publish-asset freshness   | PASS                        | `deno task check:publish-assets`, exit 0                                                                 |
| S2 full MCP tests            | PASS                        | exit 0; 131 passed, 0 failed                                                                             |
| S2 focused retrieval/policy  | PASS                        | exit 0; 29 passed, 0 failed                                                                              |
| S2 scoped check/lint/format  | PASS                        | exit 0; 114 selected files, zero failed batches/findings                                                 |
| S2 explicit source quality   | PASS                        | exit 0; `packages/mcp/src`, zero findings and allowances                                                 |
| S2 explicit doctrine         | PRE-EXISTING FAIL           | exit 1; #1403 baseline only, no new finding: A14 foreign test plus 3 WARN / 1 INFO                         |
| Aspire/container gates       | NOT_RUN                     | no token requested; no AppHost/container started                                                        |
| S3 canonical corpus builder  | PASS                        | exit 0 from fresh output/exact detached `399f60185`; 170 pages, 36 deno-doc files; required Prisma headings present |
| S3 focused evaluation        | PASS                        | exit 0; 11 passed, 0 failed across locked evaluation, release fallback, retrieval, and source-policy tests |
| S3 full MCP tests            | PASS                        | exit 0; 132 passed, 0 failed                                                                             |
| S3 scoped check              | PASS                        | exit 0; MCP 115 files + generator 2 files, zero failed batches, `--no-lock`                              |
| S3 scoped lint / format      | PASS                        | exit 0; MCP 115 files + generator 2 files, zero findings                                                 |
| S3 explicit source quality   | PASS                        | exit 0; `packages/mcp/src`, zero findings and allowances                                                 |
| S3 explicit doctrine         | PRE-EXISTING FAIL           | exit 1; unchanged #1403 baseline: A14 fail, three warnings, one info                                     |
| S3 publish-asset freshness   | PASS                        | `check:publish-assets` and staged `check:assets-barrel` exit 0; both generators reproduce their owned outputs byte-for-byte |
| S3 MCP publish dry-run       | PASS                        | exit 0; package import boundary and published source graph accepted                                      |
| S3 aggregate quality gate    | PASS / NON-DECISIVE         | `deno task quality:gate`, exit 0; scanner roots omit `packages/mcp`, so explicit package gates above remain decisive |
| S3 aggregate architecture    | PASS / NON-DECISIVE         | `deno task arch:check`, exit 0; configured roots omit `packages/mcp` under #1403                         |
| IMPL-EVAL cycle 1            | FAIL_FIX                    | separate Claude · Fable 5 verdict at `fd9267906`; stale exact CLI count assertion plus required records |
| Evaluator-fix pre-red        | EXPECTED FAIL               | focused installed-corpus test exit 1; 0 passed / 1 failed / 18 filtered; expected 2 but D12 returned 3  |
| Evaluator-fix CLI pair       | PASS                        | exact requested command exit 0; 20 passed / 0 failed (19 init + 1 real CLI stdio)                       |
| Evaluator-fix scoped check   | PASS                        | exit 0; one selected file, zero failed batches, `--no-lock`; wrapper supplies `--unstable-kv`           |
| Evaluator-fix lint / format  | PASS                        | exit 0 each; one selected file, zero findings                                                           |

## Handoff Notes

- Open `research.md` F1–F14 and spot-check the cited source before trusting the plan.
- Challenge the 12 exact-ordered citations plus Prisma unordered top-three set in `plan.md` before
  S2. A weak choice is a plan defect, not something to tune around later.
- Require the `llms#task-router` row to pass the embedded adapter, a filesystem materialization of
  the same release files, and the real `agent init --with-docs` → MCP stdio path.
- Verify every test in the failure matrix has the stated behavioral or compile-time pre-fix red.
- Treat root `quality:gate`/`arch:check` as non-decisive for MCP; require explicit package roots.
- Do not interpret retrieval evaluation as #1090 adoption evidence.
- Do not interpret the five locked evaluation rows as BM25-scoring evidence: all are covered by
  curated `routeHints`. They prove the curated routing table, corpus membership, citations, and
  adapter parity. Getting-started remains uncovered, and acceptance row 3 remains partial for the
  issue's `avoid hitting my service every render` paraphrase.
- The 301 → 367 line growth of `packages/mcp/src/domain/tool-contracts.ts` deepens existing A8 debt;
  the accepted follow-up and closure gate are in `.llm/harness/debt/arch-debt.md`.
- The first evaluator-fix check invocation redundantly supplied `--unstable-kv`, which the wrapper
  already adds; Deno exited 1 before diagnostics. The corrected decisive command omitted the
  duplicate, exited 0, and selected the same test file with zero failed batches.
