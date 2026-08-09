# Drift Log: #1102 intent-aware capability discovery

Drift is append-only.

## 2026-08-09 — Canonical prose mirror is stale and fallback selection is narrower than issue scope

- **What:** #1375's generated embedded path is sound and reachable, but its five selected pages do
  not include `llms.txt` or four issue-required destination families. The checked-in compressed
  prose also predates the current unsupported-Prisma-driver section.
- **Source:** `.llm/tools/generate-publish-assets.ts`; generated provenance; compressed prose;
  `docs/site/data-persistence/how-to/use-a-second-database.md:245`.
- **Expected:** Build on the #1375 corpus without re-deriving or duplicating its plumbing.
- **Actual:** The unsupported-driver destination is absent from the locked mirror, so extending the
  selected-path list alone would fail. The existing approved mirror builder and compressed-prose
  generator can refresh that canonical input before the same publish-assets generator selects it.
- **Severity:** material plan dependency, contained within the existing generated-asset path
- **Action:** in S3, refresh through `/home/codex/repos/.briefing/build-docs-bundle.sh` then
  `.llm/tools/docs/build-agent-docs-bundle.ts`; commit their owned prose/provenance outputs and the
  regenerated CLI/MCP assets; preserve the 262,144-byte MCP selection budget.
- **Evidence:** `research.md` F5/F12; `plan.md` D8/S3.

## 2026-08-09 — PLAN-EVAL cycle 1 exposed unmeasured filesystem `llms.txt`

- **What:** The plan made `llms#task-router` rank 1 but evaluated only the embedded selection;
  filesystem discovery accepts only `.md`, and embedded path canonicalization retained `.txt`.
- **Source:** separate-session PLAN-EVAL cycle 1 (`FAIL_PLAN`), confirmed against
  `filesystem-docs-corpus.ts` and `.llm/tools/generate-publish-assets.ts`.
- **Expected:** Filesystem and embedded corpora expose the same release sources and guidance.
- **Actual:** All previously named gates could pass without the installed filesystem corpus ever
  seeing the task router.
- **Severity:** major plan defect; no product code had started
- **Action:** D12 admits exactly root `llms.txt`, canonicalizes it to `llms` for both adapter
  inputs, rejects other text, and requires the `llms` evaluation row through embedded, materialized
  filesystem, and real `agent init --with-docs` stdio paths.
- **Evidence:** `research.md` F14; `plan.md` D12, failure matrix, S2–S4, validation gates 1–2.

## 2026-08-09 — Approved corpus builder is blocked by pre-existing invalid Vento prose

- **What:** The approved S3 mirror command cannot build the current docs site, so it refuses to
  produce a canonical bundle rather than copying stale `_site` output.
- **Source:** `docs/site/data-persistence/how-to/database-migration.md:46` at current
  `origin/main@3ce91f2c2`; the multiline quoted `desc` value was introduced by `2f64cc0011`.
- **Expected:** `/home/codex/repos/.briefing/build-docs-bundle.sh` builds the current site, then
  mirrors its complete Markdown twins with truthful commit provenance.
- **Actual:** Vento reports an unterminated string literal at the first multiline `desc` and the
  builder exits 1. It produces no `llms.txt`, `llms-full.txt`, or destination pages. The existing
  briefing bundle is stale at `918791e06` / framework `0.0.3` and lacks the required unsupported
  Prisma-driver section, so it is not a truthful substitute.
- **Severity:** S3 blocker outside #1102 product scope.
- **Action:** Report to the orchestrator for a separately owned docs repair or explicit rescope.
  Do not add a second corpus path, use `NO_SITE_BUILD=1` against partial output, or patch content
  while retaining false source-commit provenance.
- **Evidence:** raw command exit 1 from
  `/home/codex/repos/.briefing/build-docs-bundle.sh /home/codex/repos/ns005-w3b1
  /home/codex/repos/ns005-w3b1/.llm/tmp/w3-b1-docs-bundle`; current `_site` has none of the required
  outputs after the failed clean build.

## 2026-08-09 — Docs repair unblocked canonical refresh; current sources exceed the projected selection

- **What:** #1406 repaired the docs build on `main@399f60185`; the approved builder now succeeds
  from a fresh exact-revision checkout. The plan's 236,997-byte old-mirror calculation remains
  byte-exact, but several selected current pages grew beyond the projected 6,225-byte Prisma-only
  delta. Keeping the original five pages plus all eight #1102 additions is 274,497 bytes and fails
  the locked 262,144-byte generator cap.
- **Expected:** a 13-document selection at 243,222 bytes.
- **Actual:** the unchanged 13-document selection is 274,497 bytes. Removing the pre-existing
  generic quickstart page, which supplies none of the locked 15 citations, produces a 12-document
  selection at 253,511 bytes while retaining all eight issue-required additions.
- **Severity:** contained S3 selection drift; no locked evaluation ordering or required set changed.
- **Action:** retain the cap and every intent destination; drop only `pages/quickstart/index.md`
  from the fallback selection. Do not alter the complete canonical prose mirror.
- **Evidence:** generator pre-fix budget failure at 274,497 bytes; post-drift provenance reports
  253,511 bytes / 12 documents / source commit `399f60185`.

## 2026-08-09 — IMPL-EVAL found the installed-corpus count lock was stale

- **What:** D12 intentionally admits root `llms.txt`, so the generated host's installed filesystem
  corpus contains exactly three documents in registry order: `llms`, `MANIFEST`, and
  `pages/services-sdk/services`. The CLI test still expected two and omitted `llms`.
- **Expected:** D12's `list_docs.documentCount` shift from 2 to 3 is locked by the generated-host
  test, including the full ordered document list.
- **Actual:** S2/S3 ran MCP-side adapter/evaluation tests but no CLI-side pair, so the count shift
  described in the S2 worklog landed with a stale consumer assertion. S1's 20-test evidence
  predated D12 and could not prove the later behavior.
- **Severity:** blocking stale test expectation; production behavior is correct.
- **Action:** keep the assertion exact at count 3 and add the complete `llms` row; run both
  `agent-mcp-stdio_test.ts` and `init-agent_test.ts` together before re-evaluation.
- **Evidence:** IMPL-EVAL `FAIL_FIX` at `fd9267906`; local pre-fix focused run exited 1 with 0 passed
  / 1 failed, then the exact CLI pair exited 0 with 20 passed / 0 failed.

## 2026-08-09 — MCP tool-contract file deepened existing A8 debt

- **What:** `packages/mcp/src/domain/tool-contracts.ts` grew from the evaluator's 301-line baseline
  to 367 lines while the A8/AP-1/F-1 cap is 300. The doctrine finding class already existed, so the
  gate did not add a new row, but this slice deepened an over-cap file without recording it.
- **Severity:** architecture debt, not a new doctrine finding.
- **Action:** `DEBT_ACCEPTED` for this PR; a follow-up must split docs/guidance tool contracts from
  the shared contract table without changing public schemas. The canonical debt registry carries
  the same entry and closure gate.
- **Evidence:** separate IMPL-EVAL comparison against `origin/main`; package-root doctrine output is
  otherwise unchanged.

## 2026-08-09 — Evaluation proves curated routes and corpus membership, not BM25 scoring

- **What:** all five locked fixture intents activate a concept alias and `routeIndex` orders their
  hard-coded semantic `routeHints` before the score comparator. The evaluator inverted the BM25
  comparator in a scratch copy and all five rows still passed; reversing final route order failed.
- **Impact:** the S3 evaluation legitimately proves curated intent routing, section parsing,
  corpus membership, deterministic adapter parity, and citation order. It does not constrain or
  validate BM25 scoring, so it must not be cited as scoring-quality evidence.
- **Action:** carry this limitation into S4/S5 and the next evaluator handoff. A future scoring row
  must avoid every `routeHint` if scoring itself is to become acceptance evidence.

## 2026-08-09 — Retrieval coverage gaps carried into S4/S5

- **Getting started:** `create a new NetScript project from scratch` currently ranks the
  second-database driver-adapter section first. None of the five locked intents covers project
  creation; this is a coverage gap, not a #1102 acceptance violation.
- **Acceptance row 3:** the issue paraphrase `avoid hitting my service every render` still ranks
  `pages/services-sdk/services#services-contracts` first instead of `pages/web-layer/query`. The
  pre-fix miss remains post-fix, so row 3 is partial and must not be claimed complete.
- **Docs scope wording:** S3 itself changed no `docs/site/**` files, but the branch includes two
  planned docs-site changes from S1. Future comments must scope the no-docs-site statement to S3,
  not the whole PR.
- **Action:** record only; do not tune scoring or edit docs in this evaluator-fix slice.

## 2026-08-09 — Repaired-source corpus regeneration after #1412/#1414

- **What:** rebasing onto `main@4f96aec40` moved the source commits but did not regenerate the
  checked-in corpus, whose provenance and plaintext package assets still reflected `399f60185`.
- **Expected:** run the single canonical builder from a fresh detached checkout of the rebased head
  and regenerate all four owned artifacts from its fresh output, without a bypass or hand edit.
- **Actual:** the repaired canonical builder exited 0 at `eda49bb2e` and the regenerated full corpus
  records 4,685,958 uncompressed / 1,332,143 compressed bytes. The unchanged MCP selection is
  253,535 bytes / 12 documents, 8,609 bytes below the 262,144 cap and 24 bytes larger than the prior
  repaired-source selection. No additional document was dropped.
- **JSR close gate:** the regenerated plaintext package corpus makes
  `deno task check:netscript-jsr-specifiers` exit 0 with
  `scanned=2326 allowances=1 ranges=0 failures=0`; the version-drift tests pass 2/2. This is the
  regeneration evidence required to close #1411. The version-less chat descriptor
  `client stack — jsr:@netscript/ai` is not in either plaintext embed because that tutorial is not
  one of the selected 12 documents.
- **Evaluation:** the unchanged five-row / 15-citation fixture still passes 11/11 and byte-equally
  across embedded and materialized-filesystem adapters, including `llms#task-router` at rank 1 on
  both. This does not broaden the evidence beyond curated routing/corpus/parity.
- **Freshness gate note:** the first `check:assets-barrel` invocation exited 1 because its final
  git-diff assertion correctly observed the newly regenerated but unstaged CLI asset. After staging
  exactly the four generator-owned artifacts, the decisive rerun exited 0.

## 2026-08-09 — #1404 merged; S4/S5 continuation gained an unplanned retrieval-closure slice

- **What:** #1404 merged the planned S1–S3 foundation at `main@51a58b4f5`, but its IMPL-EVAL
  deliberately carried three gaps: the issue's render/fetch paraphrase still misses query guidance,
  getting-started ranks a database detail first, and the five locked rows do not constrain score.
- **Expected:** the original plan continued directly with S4 activation then S5 docs/evidence.
- **Actual:** completing #1102 truthfully requires S4A retrieval closure before activation. It adds
  three evaluation rows but changes none of the original five rows / 15 citations, ranking numbers,
  adapters, or public contracts.
- **Action:** require a fresh separate-session PLAN-EVAL. Order continuation commits S4A retrieval,
  S4B activation/real stdio, then S5 docs/release evidence.
- **Evidence:** `research.md` F15–F20; `plan.md` D13–D16 and continuation failure matrix.

## 2026-08-09 — Getting-started uses the embedded task router instead of growing the corpus

- **What:** the quickstart page removed during S3 would directly cover project creation, but adding
  its 20,986 bytes to the current 253,535-byte fallback totals 274,521, which is 12,377 over the
  262,144 cap.
- **Decision:** keep all 12 selected domain/task-router documents and the cap. Route natural project
  creation language to the existing `llms#Getting started` section, which cites and summarizes the
  Quickstart. Do not regenerate the corpus for this change.
- **Rejected:** raising the cap without demonstrated need, or silently removing another document.
  Contracts (18,823 bytes) and services (29,122 bytes) would fit but lose broader guidance.
- **Drift rule:** if the section cannot pass truthful evaluation, stop and return to evaluator; do
  not change the cap/selection as an implementation repair.

## 2026-08-09 — Package doctrine has a pre-existing nonzero continuation baseline

- **What:** at clean `main@51a58b4f5`, explicit package doctrine exits 1 with A14 fail, the accepted
  367-line `tool-contracts.ts` warning, 14/16 directory warnings, and one architecture-doc info.
  Explicit MCP source quality exits 0 with zero findings/allowances.
- **Action:** package commands remain decisive. Require a zero doctrine finding delta and record the
  raw exit 1; never label it green. Leave existing findings to #1403/debt triage and do not widen
  #1102. Root aggregates remain non-decisive because they omit MCP.

## 2026-08-09 — Scoped lint/format require the package config under Deno 2.9.5

- **What:** the approved continuation plan's lint/format commands selected 115 MCP files but did not
  pass `--config packages/mcp/deno.json`.
- **Observed:** both wrappers exited 1 before analysis because Deno 2.9.5 parsed root
  `workspace: ["packages/*", ...]` as the newer structured workspace shape. They emitted zero
  lint/format findings, so the result was a tooling invocation failure, not a product red.
- **Action:** use the wrappers' documented `--config packages/mcp/deno.json` option, matching the
  successful S1 run record. Both decisive reruns selected the same 115 files and exited 0 with zero
  findings. Update validation orders 6–7; do not change repo configuration in #1102.

## 2026-08-09 — Real activation smoke needs Claude host plus the existing no-delegation marker

- **What:** the approved S4B table selected `agent init --host vscode --editor none --with-docs`
  to avoid Aspire while expecting installed Claude skills and root `AGENTS.md`.
- **Observed:** `init-agent.ts` installs those surfaces only when `hosts.includes("claude")`;
  VS Code host with editor `none` truthfully installs generic tools/docs but neither Claude skills
  nor root guidance. The pre-fix smoke therefore exited after `agent init` but failed reading
  `AGENTS.md`.
- **Action:** use the existing tested no-delegation contract: scaffold with `--no-aspire`, create
  `.claude/skills/playwright-cli/SKILL.md`, and run the public Claude-host init. The marker makes
  `initAgent` skip `DenoAspireAgentInitializer` before any `aspire` command, while the Claude host
  installs `AGENTS.md`, skills, config, and docs. This changes only test setup, not product routing.
- **Evidence:** combined pre-fix activation run exit 1 with three named failures; post-change focused
  group exit 0 with 21/21, and exact CLI pair exit 0 with 20/20. No AppHost, container, or Aspire
  command ran. The diagnostic scaffold was moved to system trash and is recoverable.

## 2026-08-09 — Root publish dry-run mutates catalog-backed package manifests

- **What:** the required root `publish:dry-run` exited 0 but resolved `catalog:` Zod imports to an
  exact npm specifier in 18 package/plugin manifests; the package dry-run also expanded the MCP
  publish arrays. These files were clean immediately before the gate and are outside S5.
- **Action:** restored only the proven gate-created, unstaged manifest churn with `apply_patch`,
  verified every affected path plus `deno.lock` has no diff, and retained the raw exit-0 publish
  evidence. No dependency or manifest change belongs to #1102.
