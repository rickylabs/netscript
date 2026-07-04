# Research — plan-roadmap-expansion--seed

Consolidated research backing the roadmap expansion (five owner topics A–E integrated into the
Road-to-0.0.1-stable program). This is the PLAN-EVAL "Research present and current" input; per-epic
locked decisions live in `plan.md` and the `## Design` section of `worklog.md`.

## Re-baseline

- **Carried-in source:** none. This is a fresh planning run; no prior audit/plan/run is carried in.
- **Re-derived against `main`** @ `eeaff336` (worktree `.llm/tmp/wt-roadmap-expansion`, branch
  `plan/roadmap-expansion`, cut from main — see `phase-registry.md` Base-Sync Log).
- **Planning-only:** produces roadmap artifacts (epic/issue drafts, briefs) — **no framework code**.
  "Re-baseline" here = the Stage-B corpus was gathered by reading the live worktree at `eeaff336`
  **and** the private `eis-chat` working reference (exported to `.llm/tmp/eis-chat-ref`, master, 1220
  files) — not from stale material.
- **Corpus provenance:** Stage B = 5 concurrent Sonnet-5 agents (one per topic), 75 files across the
  B1–B4 contract (`matrix/`+`analysis/`+`research/`+`context/`, every cell + INDEX.md), commit
  `3d70ff5a`. Drift ledger `drift.md` (9 candidates). Supervisor synthesis
  `analysis/FABLE-STAGE-C-SYNTHESIS.md`, commit `b7964509`. Four decision-critical findings verified
  byte-for-byte by the supervisor.

## Findings

| #  | Finding (fact the plan depends on) | How to verify |
| -- | ---------------------------------- | ------------- |
| 1  | fresh-ui & eis-chat "NS One" share a byte-identical L0–L2 layer (copy-source, `copyOwnership: app-owned-after-copy`); NS One is fresh-ui's own copy output. | `analysis/A-dashboard/03-fresh-ui-vs-nsone-gap-inventory.md`; diff `packages/fresh-ui/**/button.tsx` vs `eis-chat-ref/apps/dashboard/components/ui/button.tsx` |
| 2  | fresh-ui has NO `blocks/` (L3) layer; eis-chat has 9 L3 blocks incl. `plugin-gated-view.tsx`. | `ls packages/fresh-ui/src` (no blocks dir) vs `eis-chat-ref/apps/dashboard/components/blocks/` |
| 3  | Aspire pinned 13.4.6 (clears ≥9.4 `WithCommand`); `IInteractionService` NOT in the TS AppHost SDK → route prompts via command `arguments`. | `context/A-dashboard/*`; drift A2; Aspire pin in repo aspire config |
| 4  | `plugin add dashboard` needs no CLI change; archetype analog = `plugins/streams` + `packages/plugin-streams-core`. | `analysis/A-dashboard/*`; `plugins/streams/scaffold.plugin.json` |
| 5  | Telemetry per-package grades: workers A, db B+, sagas B+ (NOOP default), auth B, triggers C+ (**W3C-parenting bug**), services C+, streams F (zero), ai F (seam never invoked). | `analysis/B-telemetry/*`; drift B2 |
| 6  | `@netscript/telemetry` structurally non-compliant (forbidden `core/`, orphan `src/public/mod.ts`, dup `./registry`) → tracked Refactor arch-debt. | `analysis/B-telemetry/*`; `ls packages/telemetry/src` |
| 7  | Real span-links only in the database Prisma bridge; Deno `OTEL_DENO` has attribute-less span links + no async-metric flush on exit → thin-vs-SDK fork is real. | `analysis/B-telemetry/*`; `research/B-telemetry/*` |
| 8  | eis-chat SigNoz join aspirational; only genuine non-Deno boundary = telemetry-dark `duckdb.exe`; TRACEPARENT injected into subprocs (7-runtime) but no non-Deno child span stitched. | `analysis/B-telemetry/eis-chat-real-pipeline-map.md`; `context/B-telemetry/eis-chat-pipeline-diagram.md` |
| 9  | Aspire OTLP query API is HTTP (`/api/telemetry/*`); CLI `aspire otel` path broken (tracked debt). | `analysis/B-telemetry/*` (was `research/B-telemetry/aspire-otlp-ingestion-and-query-api-landscape`) |
| 10 | 5 live tutorial tracks (chat separate, teaches mid-flight `@netscript/ai` `publish:false`); chapter URLs wired into 8 capability-hub nav sections; eis-chat has zero auth usage. | `analysis/C-tutorials/*`; drift C1; `docs/**` capability-hub nav |
| 11 | Two unreconciled docs IAs (`capabilities/` ~15pp vs 9 pillar folders) block per-feature authoring; only 2 competitor mentions site-wide. | `analysis/D-positioning/*`; drift D1; `docs/**` |
| 12 | 172a-2 dep is a misattribution (PR #172 merged, CLI type-soundness); server `.fetch()` `ServiceApp` seam ships; only client `ClientLinkPort` in-process adapter missing from sdk. | `analysis/E-desktop/sdk-link-mode-and-service-seam.md`; `packages/sdk/src/ports/client-link-factory.ts`, `packages/service` |
| 13 | #327 lists desktop WATCH/unscheduled; #375 p3/Backlog; tursodb exclusive OS file-lock (os error 33) shapes single-process; eis-chat validated option (b) in prod. | `analysis/E-desktop/*`; drift E2; `eis-chat-ref/DESKTOP-SHELL.md` |
| 14 | No `0.0.1-beta.6` / `0.0.1-beta.7` GitHub milestones exist yet (owner must create before issue-filing). | `gh api repos/:owner/:repo/milestones` (read-only); drift C1 |

## Delegated decisions (resolved — rationale in FABLE-STAGE-C-SYNTHESIS.md)

1. **D-NSONE** → promote the missing L3 blocks layer into fresh-ui; do NOT re-import L0–L2 (already
   byte-identical); MCP-specific components stay out unless the dashboard IA needs live MCP rendering.
   Precursor = WSL-Codex fresh-ui promotion slice (byte-diff 32 unsampled pairs; reconcile markdown
   build-path split; add L3 registry layer with copy-source + `*.prompt.md`/`*.d.ts` convention).
2. **Telemetry grouped-trace flow** → two-tier: **beta.6 flagship = Flow B** (framework-native
   multi-process pipeline, span-links for the streams fan-in); **stable = Flow A** cross-language
   duckdb.exe hop (net-new span + env-carrier + language shim).

## jsr-audit surface scan (planned public-surface deltas)

The planning run writes no code, but the epics it produces change published surfaces — the planned
deltas and their slow-type / publishability risks are named now so slicing addresses them:

- **`@netscript/fresh-ui`** — NEW L3 `blocks/` export layer (copy-source registry entries +
  `*.prompt.md`/`*.d.ts`). Risk: registry manifest typing + the markdown build-path split
  (template+codegen vs compiled) must not introduce slow types in the exported block `*.d.ts`.
- **`@netscript/telemetry`** — NEW dedicated OTEL-adapter subpath export + ports/adapters restructure
  (removes forbidden `core/`, orphan `src/public/mod.ts`, dup `./registry`). Risk: export-map
  churn + span-link/attribute types crossing the publish boundary; apply `deno doc --lint` to the
  full export map, not mod.ts alone.
- **`@netscript/sdk`** — NEW `ClientLinkPort` in-process link adapter export. Risk: the port generic
  `ClientLinkPort<TContext>` must stay explicitly typed (no inferred slow types) across the publish
  boundary.
- **NEW `packages/plugin-dashboard-core` + `plugins/dashboard`** — new published packages: full
  jsr-audit (contract base seam soundness, no phantom types, explicit return types) at plan time in
  the epic acceptance criteria.

(Detailed per-package surface scans are delegated to the Opus deep-dives and re-checked at each
slice's IMPL-EVAL; this is the plan-time risk naming the Plan-Gate requires.)

## Open questions (closed at ratification / Stage D)

- Owner forks: missing beta.6/beta.7 milestones; **#232** rescope vs new docs-cut child epic; **#327**
  rescope + **#375** promotion.
- Stage-D verifications: MCP HTTP traceparent propagation + streams real UI consumer (Opus-B);
  fresh-ui 32-pair byte-diff + MCP-component scope (Opus-A); ClientLinkPort sub-slice-vs-issue
  (Opus-E); docs IA target + #232 recommendation (Opus-CD).
