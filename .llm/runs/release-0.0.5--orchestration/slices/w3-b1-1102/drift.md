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
