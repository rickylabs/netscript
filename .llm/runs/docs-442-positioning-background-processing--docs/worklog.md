# Worklog — docs/442-positioning-background-processing (issue #442, D3)

Branch `docs/442-positioning-background-processing` from `7f7ed76b`. Docs-authoring lane under the
beta-7 shipping orchestrator (session `df71d36c`), per the CLAUDE.md documentation-authoring
exception. Scope: `docs/site/background-processing/{index,workers,polyglot-tasks}.md` only.

## Plan

Apply the proposal §4.2 story template to the background-processing pillar:

- `workers.md` (T2): elevator pitch → story spine → (existing) mechanism → one factual
  Trigger.dev-vs-Temporal comparison table → cross-links (already present).
- `polyglot-tasks.md` (T3, light): pitch + short story paragraph; no competitor comparison
  (design table: "light / none").
- `index.md` (pillar hub): pitch + story framing above the existing cards grid.
- Cite the live #638 published-mode caveat factually; do not document the published install flow
  as working end-to-end on 0.0.1-beta.7.

Sources read: common brief; issue-442 brief; `design/CD-docs/proposal.md` §4;
`design/CD-docs/epic-and-issues.md` §4 (D3 row + D-common bar);
`context/D-positioning/authoring-constraints.md`;
`context/D-positioning/elevator-pitch-raw-material.md` (items 2, PROSCO spine, confirmed gaps);
`research/D-positioning/competitor-teardown.md` (§ Trigger.dev, § Inngest/Temporal, §2 mapping,
§3 landmines); GitHub issue #638 body.

## Evidence

- **workers.md**
  - Elevator pitch ("One typed handler file is the whole job") — build-efficiency framing; every
    capability named (registration, dispatch, retry, execution tracking, scheduling, tracing, HTTP
    trigger API) restates mechanism already documented on the page and verified in prior cuts.
  - Story spine "The story: a screenshot becomes a diagnosis" — grounded in the eis-chat raw
    material (STRONG items only): `workers/jobs/transcribe-image.ts` vision job; the
    `#kb-image-payload` 64 KB Deno KV enqueue-cap bug + reference-through-the-queue fix;
    single-writer/compute-only worker shape (tursodb exclusive file lock). Private codename not
    used on the page (site precedent: eis-chat appears only as an example identifier). Deferred
    SigNoz step and promotion path NOT claimed.
  - "How it compares" — factual three-column table (NetScript / Trigger.dev / Temporal), category
    rows, no adjectives in cells, one neutral tradeoff sentence up front (Trigger.dev vs-page
    structural technique per teardown). Competitor facts trace to teardown citations
    (trigger.dev/vs/temporal rows: determinism required No-vs-Yes incl. no Date.now()/
    Math.random()/direct I/O; self-hosted minimum Docker Compose vs Database+Elasticsearch+
    Server+Workers). NetScript cells restate the page's own documented surface (defineJobHandler,
    runner modes, queueProvider enum, Postgres defs + KV execution state, workers API :8091).
    Dated "as of mid-2026".
  - #638 caution callout after the published `netscript plugin install` command with
    `<!-- caveat: gh:#638 -->`: published-mode (jsr) root import map omits @netscript/sdk{,/client}
    on 0.0.1-beta.7 → worker runtime cannot load jobs until the root map is patched; local-source
    unaffected. Matches issue #638 body verbatim in substance.
- **polyglot-tasks.md** — pitch ("Keep the script, gain the runtime") + one story paragraph
  (Python transform step in an import pipeline; links `/tutorials/erp-sync/03-polyglot-transform/`;
  trace-context injection claim restates the page's existing TRACEPARENT/TRACESTATE mechanism).
  No competitor comparison (T3).
- **index.md** — pitch + two-story framing paragraph linking both leaves; added
  `/durable-workflows/` cross-link. Cards grid untouched; no `_data.ts` change.

## D-common bar check

- [x] Story template: pitch → spine → mechanism (cross-linked, pre-existing) → one factual T2
      comparison (workers.md only) → cross-links.
- [x] Positioning law: no throughput/benchmark, no superlatives, no honesty framing, no fabricated
      %/social proof (diff grep clean); no unshipped-capability claims — new prose only restates
      already-documented page mechanism + issue-#638 facts; deferred items not claimed.
- [x] No `_plan/*` prose lifted.
- [x] Diátaxis respected — links into tutorials/how-to/reference, no duplication.
- [x] No orphan page (all three pages pre-existing in nav; `_data.ts` untouched).

## Validation

`deno task verify` in `docs/site` (build → check:links → check:caveats):

- Site built into `_site` — 500 files generated in 11.07 seconds
- `23021 internal links across 162 pages — all resolve`
- `28 caveat markers across 22 pages — all references resolve`

VERDICT: verify GREEN.
