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
