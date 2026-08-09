# Worklog: #1102 intent-aware capability discovery

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `release-0.0.5--orchestration/slices/w3-b1-1102` |
| Branch         | `feat/mcp-intent-activation-s4-s5`               |
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
| 2026-08-09 | S3    | Rebase refresh     | Verified remote head `f47d22329`, rebased without a merge onto `main@4f96aec40`, and used Deno 2.9.5. A fresh detached checkout at rebased head `eda49bb2e` plus a fresh output directory ran the repaired canonical builder with no bypass: exit 0; source-format OK, 617 generated files, rendered-output OK (220 HTML / 4 allowances), bundle OK (170 pages / 36 deno-doc / 9.1M). |
| 2026-08-09 | S3    | Regeneration       | Regenerated the canonical compressed prose/provenance and both CLI/MCP generated assets. Provenance is `eda49bb2e`; full corpus is 4,685,958 uncompressed / 1,332,143 compressed bytes. The unchanged 12-document selection is 253,535 bytes against 262,144 (+24 from the prior repaired build, 8,609 headroom), so no document was dropped. The chat prose descriptor `client stack — jsr:@netscript/ai` is outside the plaintext selection. |
| 2026-08-09 | S3    | Rebase proof        | Root JSR guard exit 0 (`scanned=2326 allowances=1 ranges=0 failures=0`); version-drift 2/2; locked focused group 11/11; full MCP 132/132; CLI pair 20/20; generator tests 2/2. Scoped MCP check/lint/fmt, explicit package quality, publish-assets freshness, staged assets-barrel freshness, and MCP publish dry-run all exited 0. The first assets-barrel invocation exited 1 only because its git-diff freshness check observed the expected unstaged regenerated asset; after staging the exact four generator outputs, the decisive invocation exited 0. |

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
| S3 canonical corpus builder  | PASS                        | latest exit 0 from fresh output/exact detached `eda49bb2e` rebased on `main@4f96aec40`; 170 pages, 36 deno-doc files; source/render guards green |
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
| Rebased JSR specifier guard  | PASS                        | exit 0; `scanned=2326 allowances=1 ranges=0 failures=0` against regenerated repaired-source corpus      |
| Rebased version drift        | PASS                        | exit 0; 2 passed / 0 failed                                                                               |
| Rebased focused evaluation   | PASS                        | exit 0; 11 passed / 0 failed; unchanged five rows / 15 citations byte-equal across both adapters         |
| Rebased full MCP tests       | PASS                        | exit 0; 132 passed / 0 failed                                                                              |
| Rebased CLI pair             | PASS                        | exit 0; 20 passed / 0 failed                                                                               |
| Rebased generator tests      | PASS                        | exit 0; 2 passed / 0 failed                                                                                |
| Rebased scoped static gates  | PASS                        | check/lint/fmt exit 0; MCP 115 files plus exact CLI asset file, zero failures/findings                    |
| Rebased package quality      | PASS                        | exit 0; explicit `packages/mcp/src`, zero findings/allowances                                             |
| Rebased asset freshness      | PASS                        | `check:publish-assets` exit 0; initial unstaged assets-barrel exit 1, decisive staged rerun exit 0        |
| Rebased MCP publish dry-run  | PASS                        | exit 0; publish simulation completed                                                                       |

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

## 2026-08-09 — S4–S5 continuation planning

- Started clean from `origin/main@51a58b4f5` after #1404 merged; created
  `feat/mcp-intent-activation-s4-s5` and removed its upstream. No product source changed.
- Re-read the live #1102 body and retained all seven acceptance rows verbatim. #1090 adoption
  remains out of scope. `Closes #1102` is deferred until implementation evidence supports every
  row.
- Re-opened every load-bearing retrieval, activation, CLI stdio, generated-skill, docs, corpus, and
  gate source. Confirmed the two carried retrieval failures and the five-row scoring blind spot.
- Measured the quickstart decision: selected fallback 253,535 bytes / 12 documents; quickstart
  20,986 bytes; combined 274,521, which is 12,377 above the 262,144 cap. Plan D13 uses the already
  embedded `llms#Getting started` section with zero corpus-byte delta.
- Locked three additive evaluation rows. The original five rows / 15 citations are unchanged. The
  score-only row activates no concept and will be mutation-tested by reversing only the score
  comparator in an owned detached scratch checkout.
- Re-ran public-surface planning baselines:
  - JSR audit: exit 0; 115 files / 12,311 LOC; known cardinality 14/16 + slow-types warnings.
  - MCP doc-lint: exit 0; combined diagnostics 0.
  - MCP publish dry-run: exit 0.
  - NetScript JSR specifier guard: exit 0;
    `scanned=2326 allowances=1 ranges=0 failures=0`.
  - package quality scanner: exit 0; findings 0, allowances 0.
  - package doctrine: raw exit 1; exact pre-existing inventory is A14 fail, three warnings, one
    info. The plan uses zero-delta evidence and does not misreport this as green or fix #1403 debt.
- Replaced the stale unimplemented S4/S5 rows with continuation slices S4A retrieval closure, S4B
  activation/real stdio, and S5 docs/release evidence. All non-Aspire gates precede a pushed
  `EXPENSIVE-GATE-REQUEST`; no runtime token has been requested or used.
- Next: commit/push plan artifacts, open draft PR, apply exactly `status:plan-eval`, post the plan
  handoff, and stop for the owner-routed separate Claude · Fable 5 evaluator.

## 2026-08-09 — PLAN-EVAL PASS and S4A retrieval closure

- Received the owner-routed separate Claude · Fable 5 PLAN-EVAL `PASS` at plan head `71c0a29c2`.
  Recorded the verdict and its three binding carries in `plan-eval-s4-s5.md`; moved issue #1102 and
  PR #1416 to exactly `status:impl` before product edits.
- Test-first pre-fix run:
  `deno test --no-lock --allow-all packages/mcp/tests/guidance-evaluation_test.ts
  packages/mcp/tests/guidance-retrieval_test.ts` — exit 1; 4 passed / 2 failed. The issue sentence
  ranked services contracts and the phrase-family test ranked the same wrong destination.
- Added a real cache-freshness phrase family (`every render`, `every request`, request-on-render,
  refetch-on-render) and a focused test covering the issue sentence plus two non-quoted
  paraphrases. Added the finite getting-started concept routed to `llms#Getting started`.
- Added three fixture rows without changing the original five rows / 15 citations. The score-only
  row asserts zero activated concepts; the getting-started row locks rank one; the issue paraphrase
  locks the existing cache-first top three.
- Focused validation order 1 — exit 0; 12 passed / 0 failed across evaluation, retrieval,
  source-policy, and release-fallback tests. The planned score-only order passed exactly, so no
  fixture drift or expectation rewrite occurred.
- Mandatory mutation control:
  - owned detached scratch worktree changed only `right.score - left.score` to
    `left.score - right.score`;
  - scratch evaluation exit 1, 0 passed / 1 failed, naming
    `pick direct application ownership versus a reusable integration`; actual top three became
    `llms#tutorials`, `web-layer/route#routing-and-route-contracts`, and
    `llms#getting-started`;
  - immediate clean-checkout rerun exit 0, 1 passed / 0 failed;
  - scratch worktree removed and pruned.
- Full `packages/mcp/tests/` — exit 0; 133 passed / 0 failed.
- Scoped check — exit 0; 115 selected files, 0 failed batches, `--no-lock`.
- First scoped lint/format invocations — exit 1 before file analysis because Deno 2.9.5 rejected
  root workspace syntax (`invalid type: string "packages/*", expected WorkspaceConfig`); zero lint
  or format findings were produced. The prior run record identified the package-config form.
- Decisive scoped reruns with `--config packages/mcp/deno.json` — lint exit 0 and format exit 0;
  115 selected files, zero findings. `plan.md` now records the executable command shape.
- Explicit MCP source quality — exit 0; findings 0, allowances 0. Publish-asset freshness — exit 0.
- Doctrine raw exit 1 with byte-identical pre-existing inventory: A14 fail, three warnings, one
  info. No finding was added or deepened.
- Corpus invariants: original five fixture rows compare byte-equal to plan head; generated corpus
  assets have no diff; provenance remains 12 documents / 253,535 bytes under 262,144.
- Reconcile: #1102 remains open at `status:impl`; PR #1416 remains draft and references rather than
  closes it. No new review/evaluator comments changed S4A scope. Next slice is S4B activation.

## 2026-08-09 — S4B primary-workflow activation

- Test-first combined MCP/init/CLI activation run — exit 1; 18 passed / 3 failed. MCP initialize
  lacked the activation rule, generated `AGENTS.md` lacked it, and the first real smoke setup used
  VS Code host + editor none, which installs docs/tools but correctly does not install Claude
  `AGENTS.md` or skills.
- Recorded the test-setup drift after opening the implementation: the public smoke now scaffolds
  with `--no-aspire`, installs the existing Playwright skill marker, and invokes public
  `agent init --host claude --editor none --with-docs`. `initAgent` sees that marker and skips the
  Aspire initializer before any Aspire command while installing every guidance surface.
- Added the one activation contract across MCP initialize instructions, generated `AGENTS.md`, and
  source `netscript` / `netscript-build` skills: before unfamiliar API or architecture work, call
  `find_guidance`; keep `search_docs` literal and `get_doc` exact.
- Regenerated `packages/cli/src/kernel/assets/skills.generated.ts` from source; no generated file
  was hand-edited.
- Focused MCP/init/CLI group — exit 0; 21 passed / 0 failed.
- Exact CLI pair — exit 0; 20 passed / 0 failed. The real smoke ran public `agent init --with-docs`,
  read installed `AGENTS.md` and both skills, started public `agent mcp` against
  `.netscript/docs`, called `find_guidance`, and received rank-1 `llms#task-router`.
- Scoped check/lint/fmt — exit 0 each; 135 selected files, 0 failed batches/findings, `--no-lock`
  on check and package config on lint/format.
- Explicit quality scan over MCP source and CLI agent source — exit 0; findings 0, allowances 0.
- `check:publish-assets` — exit 0. Staged `check:assets-barrel` — exit 0; source and generated skill
  asset reproduce byte-for-byte.
- Diagnostic scratch scaffold was moved to system trash after inspection; it is recoverable. No
  AppHost, container, Aspire CLI, or `e2e:cli` suite ran.
- Reconcile: no new PR comments or issue changes alter scope. #1102 stays open and the draft remains
  `status:impl`; S5 public docs and full non-Aspire evidence remain.

## 2026-08-09 — S5 public docs and non-Aspire close gates

- Added a docs-drift assertion across `packages/mcp/README.md`, the MCP reference, and Agent
  tooling. Test-first registry run — exit 1; 5 passed / 1 failed because the unfamiliar-work
  activation contract was absent. After the three public docs gained the same intent/literal/exact
  workflow, the focused registry run exited 0; 6 passed / 0 failed.
- Regenerated `packages/mcp/src/publish-assets.generated.ts` from the README. The generated corpus
  remains byte-unchanged at 253,535 bytes / 12 documents against the 262,144-byte cap; no prose,
  provenance, CLI agent-doc asset, or lockfile changed.
- Focused retrieval/evaluation/source-policy/release-fallback group — exit 0; 12 passed / 0 failed.
  Eight locked rows pass byte-equal on embedded and materialized-filesystem adapters, including
  rank-1 `llms#task-router`. S4A's mandatory scratch score inversion already exited 1 naming the
  score-only row, followed immediately by a clean exit-0 evaluation; S5 changes no scorer/fixture.
- Full MCP package — exit 0; 134 passed / 0 failed, no skipped test. Required CLI pair — exit 0;
  20 passed / 0 failed, including real `agent init --with-docs` → installed filesystem → public
  `agent mcp` → rank-1 `llms#task-router`.
- Scoped check/lint/fmt — exit 0 each; 135 selected files, zero failed batches/findings, check used
  `--no-lock`, lint/format used the package config.
- Decisive MCP quality — exit 0, zero findings, zero allowances. Decisive doctrine inventory — raw
  exit 1 with the exact pre-existing #1403 baseline: A14 fail, three warnings, one info; zero delta
  and not called green.
- Non-decisive aggregates: `quality:gate` exit 0 and the separately invoked `arch:check` exit 0.
  The commands emitted no `skipped=` summary; their logged task graphs ran, but neither is used as
  MCP package evidence because their configured roots omit MCP.
- Generated/JSR checks: `check:publish-assets` exit 0; `check:assets-barrel` exit 0;
  `check:netscript-jsr-specifiers` exit 0 with
  `scanned=2326 allowances=1 ranges=0 failures=0`.
- Docs: registry 6/6 exit 0; canonical site `verify` exit 0 (`Docs source format: OK`, 617 files,
  rendered 220 HTML / 4 existing syntax allowances, 32,772 links / 220 pages, caveats 18 / 14);
  root `docs:links` exit 0 with zero broken links/anchors; `docs:accuracy` exit 0.
- JSR audit exit 0 with the known two cardinality warnings and slow-types banner. MCP doc-lint exit
  0 with combined diagnostics 0 across all three exports. MCP publish dry-run exit 0; root publish
  dry-run exit 0. Review threads exit 0 with `threads=0 unanswered=0`.
- The root publish dry-run resolved catalog imports and reformatted one package manifest in the
  worktree. Every proven gate-created manifest edit was restored before commit; no such churn or
  lock change remains.
- Reconcile: the implementation evidence now covers S4A, S4B, and S5, but the serialized runtime
  verdict and separate IMPL-EVAL have not run. The PR therefore retains `Refs #1102`, unchecked
  Definition-of-Done rows, draft state, and `status:impl`; #1090 remains untouched.

EXPENSIVE-GATE-REQUEST

All non-Aspire gates above are complete. Request a durable ledger grant before the one allowed
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`, bracketed by leak checks.

## 2026-08-09 — Publish-gate manifest forensics after S5 push

- Timing correction: S5 had already committed as `93fd65adf` before the orchestrator's stop message
  reached this thread. Direct commit inspection proves it contains zero `deno.json` paths, and the
  branch worktree was clean at the start of this forensic pass.
- Reproduced the exact root `deno task publish:dry-run` in a detached `/tmp` worktree at the S5
  head. While `deno publish` ran, all 19 named package/plugin manifests were modified; after the
  wrapper reached `Success Dry run complete`, its `finally` restored all 19 and status was empty.
- Opened the producer: `publish-workspace.ts:38-46` performs live snapshot/materialize/write and
  lines 87-90 restore. This proves the command and mechanism rather than inferring from sequence.
- Removed the owned detached scratch worktree after evidence collection. No AppHost, container,
  Aspire command, or runtime E2E ran. The serialized token request remains pending.

## 2026-08-09 — Granted serialized runtime proof

- Verified the clean branch at `c52fee4e5` and durable single-use grant row 66 in commit
  `12357e33a` before execution.
- Pre-leak check — exit 0; Aspire and Docker probes `ok`. It reported only
  `redis-jfgcbtaf` as a stale **foreign** container owned by
  `/home/codex/repos/w6-review-desk`; left untouched. The suite and its generated project were
  rooted inside this worktree, so no external `--owned-root` was required.
- Ran exactly once from the repository root:
  `deno task e2e:cli run scaffold.runtime --cleanup --format pretty ; echo "RAW_EXIT_CODE=$?"`.
- Captured shell result: `RAW_EXIT_CODE=0`. Suite summary:
  `passed=79 failed=0 skipped=2`, total 81 steps.
- Every skip, individually:
  - `behavior.otel.stream-consumer` — `DEFERRED #1398: workers-combined does not install the stream mutation hook`.
  - `behavior.otel.traces` — `DEFERRED #1398: TC-14 requires the deferred Flow-B stream-consumer record`.
- `cleanup.aspire-stop` passed in 737 ms. Post-leak check — exit 0; Aspire and Docker probes `ok`,
  no run-owned survivor, and only the same foreign Redis container remained. It was reported and
  left alone. The checked-in `leak-report.md` is the post-run artifact.
- Post-run source hygiene: no `deno.json` or `deno.lock` diff; the runtime created no product-source
  change.
- Closure decision: all seven #1102 implementation acceptance rows now have evidence at this head.
  In particular row 3 requires the quoted issue sentence plus two unquoted family paraphrases—
  `reuse service data instead of making a new request on each render` and
  `avoid refetching data on every request`—to rank
  `pages/web-layer/query#a-cache-first-load-pattern` first. The PR still carries `Refs #1102`
  because the locked close gate requires the owner-run separate-session IMPL-EVAL PASS before the
  closing keyword and DoD checks are applied; this implementation session does not self-certify.
