# Amendment IMPL-EVAL (S6) — fix-pure-route-url-utilities--c2

Bounded independent review of the generated-document correction only. It adjudicates the S6
generated delta; the original IMPL-EVAL in `evaluate.md` is retained and remains the verdict of
record for the source work.

## Metadata

| Field                    | Value |
| ------------------------ | ----- |
| Run ID                   | `fix-pure-route-url-utilities--c2` |
| Target                   | Issue #2040 / draft PR #2090 — S6 canonical agent-docs prose refresh for `packages/cli` embedded carrier |
| Review class             | Documentation amendment: hard maximum two evaluator rounds; this is round 1 |
| Evaluator                | Independent Zhipu GLM session (`opencode-go/glm-5.3-flash`, max) — separate session and vendor family from the OpenAI lane-C2 generator; owner-recorded route in `supervisor.md`, no fallback needed |
| Evaluated full HEAD      | `d412159803cb71321047d2ef393934c51db213ef` (working tree at review time; only this report is written on top) |
| Evaluated amendment      | `1cb73eb36420220dc1ab62de43f0de7ca9581b86` — the generated-asset commit adjudicated here |
| Delta base               | `b1adc4d94ea0a950212b10818f5c1a318bab0c53` (commit recording the original independent PASS); delta to HEAD inspected as `b1adc4d94..HEAD` |
| Generation launch        | `74c0a17b4dc6ab34044c15448f2b91148243cea1` — clean committed source at generation launch; provenance `sourceCommit` matches |
| Original PASS (inherited)| `dd452c4b1330044cfe12ebabef1a8bb345cb71d7` at source `d34ccaceec21198afa791ed5efbd7f5da15f2004` (`evaluate.md` PASS) |
| PLAN-EVAL                | Amendment `N/A` recorded before generation (mechanical generated-document freshness under the already approved documentation migration) — ordering holds: provenance extraction `2026-10-08T03:10:17.508Z` lands after the `74c0a17b4` run-artifact/plan commit that records the N/A |
| Bundle hash              | `03fcbe65897f5f8613886efe276088daedc46932908f440d429d9bc13c591071` — independently recomputed as sha256 of the decompressed new bundle; equals new provenance and embedded carrier provenance |

## Scope Disciplines Observed (brief compliance)

- Review read exact full HEAD, the amendment commit, and the delta `b1adc4d94..HEAD`; no branch,
  history, public, or EIS writes; no source edits; no CI polling; no delegation; no release/scaffold
  work.
- Not re-tested (inherited, unchanged): original source behavior, production Fresh SSR/browser
  qualification, full Fresh suite, quality/architecture pass at `d34ccacee`, accepted
  `route-doc-baseline-2040` debt row, and the export corpus (`check:mcp-export-corpus` re-corroborated
  below at the inherited checksum).
- Decompressed extraction and comparisons ran in ephemeral task scratch; no generated blob
  (multi-MB base64/diff) was dumped; committed tree stayed clean apart from this report.

## Amended Delta Verification

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Delta `b1adc4d94..HEAD` is narrow | PASS | Exactly 8 files: `.llm/assets/agent-docs/prose.json.gz` (Bin 1417909→1418484), `.llm/assets/agent-docs/provenance.json` (+10−10), the CLI carrier `packages/cli/src/kernel/assets/agent-docs.generated.ts` (12 changed lines) and five `.llm/runs/…` artifacts (worklog, context-pack, drift, plan S6, evaluate brief). Zero `deno.lock`, dependency, runtime source, public API, test, scaffold/command/packaging change. |
| Amendment commit content | PASS | `1cb73eb36` itself changes exactly the two assets, the carrier, and two run-artifact files; the interceptor run-artifact commit `d41215980` adds only worklog/context-pack records of the committed gates. |
| Generation from clean committed source | PASS | Provenance `sourceCommit: 74c0a17b4` = committed plan/supervisor-receipt state; docs and `packages/fresh` sources show zero commits after `d34ccacee` touching them (`git log d34ccacee..HEAD` over `docs/site/web-layer/route.md`, `packages/fresh/src`, `README.md` is empty). |
| No hand-written generated data | PASS | Carrier diff elides to exactly five embedded provenance values plus the single base64 line; disciplined `// @generated … Do not edit by hand` header present; generator identity `generate-cli-assets-barrel.ts` unchanged. |

## Decompressed Prose Verification (private extraction, content-level)

| Check | Result | Evidence |
| ----- | ------ | -------- |
| No added/removed pages | PASS | Top-level shape unchanged (`schemaVersion` + `files`); `files` has exactly 182 keys on both sides; zero added, zero removed. Provenance `files` array is byte-identical old→new (10-line diff carries only sourceCommit/extractionTimestamp/byte counts/sha256). |
| Exactly two changed keys | PASS | `pages/web-layer/route/index.md` (20135→21173 chars) and `llms-full.txt` (2358892→2359930 chars); all other 180 keys JSON-identical. |
| Route prose delta is the approved migration text | PASS | Three in-place hunks only: (1) pure-utilities paragraph replacing the "function of the base state" line, with the explicit `ordersPage.hooks.useSearch()` + `search: { ...current, page: current.page + 1 }` example; (2) "Current-search preservation is an explicit hook or component capability." replacing the old matching-route-only wording, plus the migration note (`preserveSearchParams` stays accepted but these utilities never read context; call hooks at component top level; bound `Link` unchanged); (3) paired/partial purity note passing current search via `search`/`partialSearch`. Matches the S2/S3 approved migration docs (`docs/site/web-layer/route.md`, last touched `c5284ec6c`/`d34ccacee`). |
| `llms-full.txt` delta | PASS | Removed/added line sets of the aggregate diff are sequence-identical to the route-page diff (byte-compared, sha256 of both lists equal) — the aggregate changed only by the refreshed route page, once. |

## Carrier / Provenance Equality

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Carrier embeds the committed bundle | PASS | `EMBEDDED_AGENT_DOCS_GZIP_BASE64` decodes (base64→gzip) to 1,418,484 bytes byte-identical (`cmp` empty) to `.llm/assets/agent-docs/prose.json.gz` committed at `1cb73eb36` and identical at HEAD. |
| Decompressed bundle hash | PASS | sha256 of decompressed new bundle = `03fcbe65…591071` = new provenance `sha256` = carrier `EMBEDDED_AGENT_DOCS_PROVENANCE["sha256"]` = worklog claim; old bundle hash `5b8357a1…` matches old provenance (`5b8357a1…`, 4,931,961 uncompressed bytes). |
| Provenance/corpus bookkeeping | PASS | `uncompressedBytes` +2092 (4,931,961→4,934,053) and `compressedBytes` +575 match `wc -c` of decompressed extracts and the committed byte delta; version `0.0.7` unchanged. |
| Carrier shape/export surface unchanged | PASS | Same three export names (`EMBEDDED_AGENT_DOCS_GZIP_BASE64`, `EMBEDDED_AGENT_DOCS_PROVENANCE`, `EMBEDDED_AGENT_DOCS_PACKAGE_EXPORTS`); `PACKAGE_EXPORTS` untouched by the diff; no new export, type, or public entrypoint. |

## Gates (independently rerun at evaluated HEAD)

| Gate | Command | Result | Evidence |
| ---- | ------- | ------ | -------- |
| Canonical prose freshness, committed source | `deno task check:agent-docs-prose` | PASS | Raw exit 0; site build renders 228 HTML files; output `{"fresh":true,"stalePaths":[]}` with provenance sha `03fcbe65…` and `sourceCommit: 74c0a17b4` — exactly the committed bundle. |
| Owning generator tests | `run-deno-test.ts` → `.llm/tools/docs/build-agent-docs-bundle_test.ts` (`--frozen --allow-all`) | PASS | Raw exit 0; structured summary `passed 4, failed 0, ignored 0`. |
| Embedded docs consumer tests | `run-deno-test.ts` → `packages/mcp/tests/release-embedded-docs-corpus_test.ts` | PASS | Raw exit 0; summary `passed 4, failed 0, ignored 0`. |
| Committed-source carrier barrel | `deno task check:assets-barrel` | PASS | Raw exit 0 with empty diff (the committed carrier is exactly what the canonical generator produces from the committed assets); the earlier pre-commit exit-1 raw receipt (`route-ci-carrier`) shows the expected uncommitted-delta failure, its output was committed, not ignored (`route-ci-committed-carrier` empty = no remaining delta). |
| Export corpus freshness | `deno task check:mcp-export-corpus` | PASS | Raw exit 0; inventory sha `2e7db5f4db8ff58f8c9fe5ab58bb96e91982ab5f76e00e419fd1e3ebb8f44265` — the inherited unchanged checksum (35 packages / 275 subpaths / 7908 symbols): export corpus and freshness unchanged by the amendment. |
| Owning CLI doc lint | `deno task doc:lint --root packages/cli` | PASS | Raw exit 0; structured tail byte-identical to the generator receipt (`route-ci-cli-doc`, exit 0). |
| Owning CLI JSR audit | `audit-jsr-package.ts --root packages/cli --text` | PASS | Raw exit 0; output byte-identical to the generator receipt (`route-ci-cli-jsr`), same two pre-existing WARNs (`F-DOCT-5` 16-child `src/kernel/assets` cardinality — the carrier directory itself, unchanged in size/vocabulary — and `F-JSR-7`), no FAIL. |
| Raw publication dry-run | committed receipt `route-ci-cli-publish` | PASS (receipt-corroborated) | Receipt ends `Success Dry run complete`. Not re-launched here (heavy, and the SHA/shape evidence above already proves the published data surface unchanged); per brief this stays receipt-corroborated. |

## Receipt Corroboration (sibling private evidence)

Every identity claim in the worklog cross-checks against the sibling receipts and my reruns:
`route-ci-prose-tests` 4/0 and `route-ci-embedded-prose-tests` 4/0 = my reruns; `route-ci-corpus`
sha `2e7db5f4…` = my rerun; `route-ci-prose-fresh`/`route-ci-committed-prose` `fresh:true, stalePaths
[]` with sha `03fcbe65…` = my rerun; `route-ci-cli-doc` exit 0 and byte-identical tail = my rerun;
`route-ci-cli-jsr` exit 0 = my rerun; mutation-free amendment (no new tests, no mutation receipts
required) consistent with the 8-file delta containing no test files.

## Release-Class / Gate Class Adjudication

- `scaffold.runtime`, e2e-prod and the composite release gate: **N/A** — the delta contains no CLI
  command/flow, scaffold, plugin, service wiring, Aspire, DB, packaging, or publish-shape change; only
  an existing documentation data carrier's compressed payload + provenance refreshed. The supporting
  publication-relevant evidence that did run (CLI doc lint, CLI JSR audit, raw publish dry-run
  receipt) is green.
- Owner-required follow-ups unchanged and not re-adjudicated: actual publication of the modified
  package and a fixed published-consumer verification remain owner gates; **no `Fixes` claim and
  still no closing keyword** on issue #2040 / PR #2090 (this review makes no merge decision).

## Anti-Pattern / Doctrine Sweep

No new code paths: the only non-run-artifact delta is generated data inside the existing carrier
boundary (CLI embedded-data carrier, doctrine-consistent — the bundle is opaque generated output
with declared provenance, not a hand-maintained module). `AP-18`-style generated-string snapshot
concerns do not arise: the extraction is provenance-hashed and canonical-freshness-gated. No
`deno-lint-ignore`, cast, or suppression added anywhere in the delta. No new debt entry; the
inherited `route-doc-baseline-2040` row is untouched by this amendment (debt delta: 0 new, 0
resolved, 0 deepened, 0 unrecorded).

## Findings

| Severity | Finding | Required action |
| -------- | ------- | --------------- |
| none | No high/medium/low finding. Every brief-level verification holds independently. | none |
| info | The `F-DOCT-5` WARN on `src/kernel/assets` cardinality is pre-existing carrier-folder reality, unchanged by this amendment; it rides on the accepted original audit, no new debt. | owner awareness only |
| info | The amendment must not be mistaken for completion: publication + qualified published consumer remain owner acceptance items before any close-out of #2040 (unchanged from `evaluate.md`). | owner |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | **PASS** |
| Rationale | The S6 amendment is exactly what its bounded brief declares and nothing else: one canonical generator run at clean committed source `74c0a17b4` refreshing solely `.llm/assets/agent-docs/prose.json.gz` (bundle `03fcbe65…`), its `provenance.json`, and the existing CLI embedded carrier provenance/payload, plus run-artifact records — no runtime source, public API, dependency, lock, test, or packaging change. Independently proven: delta b1adc4d9→HEAD is 8 narrow files; decomposition shows 182 keys with zero add/remove and exactly the two claimed changed keys whose content is the approved route migration prose (llms-full delta byte-identical); carrier base64 decodes byte-equal to the committed gz and hashes to the claimed bundle sha. Canonical freshness, generator and embedded-consumer suites, committed carrier barrel, corpus freshness (inherited `2e7db5f4…`), owning CLI doc lint and JSR audit all re-run green by this evaluator; quality/architecture and publication dry-run corroborated via receipts; release-class gates correctly N/A. PLAN-EVAL N/A was recorded before generation with ordering evidence. Inherited original PASS (`dd452c4b1`/`d34ccacee`) and accepted `route-doc-baseline-2040` are untouched and remain the scope of record. |
