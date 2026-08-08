# Plan — docs-mainpages--orchestrator

Scope overlay: SCOPE-docs. No `packages/`/`plugins/` source changes on any docs lane; any
framework-source need (e.g. `*Namespace` exports) escalates to a WSL Codex slice.

## Charter B / P1 first: finish PR #1209 (#1208 phase 1, p0)

Corrected bar (owner): **narrative consistency over feature checklists**; homeless features
route to #1210 deep-dives; slop-audit findings in drift.md govern.

Slices:
1. **Slop repair (live-dashboard/04):** remove the auth force-fit (`resolveAuthSession`,
   `tenantId`, 401 throws) — the tutorial has no preceding auth step; restore the Step 1
   contract's `status` filter; delete numbered feature-checklist comments; restore the deleted
   builder apiTable + "dense part" callout, integrated with the (real, verified) additions:
   `withResource` dedup, dehydrate/hydrate query flow, `Deferred` stats partial. `withForm`
   duplicating the island's optimistic mutation is checklist slop → route to #1210 deep-dive.
   Keep `withForm` only where a tutorial narratively needs a server-bound form.
2. **traces gap:** one short prose pass tying the existing `.withTelemetry` span to Aspire
   traces (currently 0 occurrences of "traces").
3. **Hygiene:** revert the stray `deno.lock` `@netscript/queue` line if the type fixture does
   not need it; keep the type fixture green (`run-deno-check` scoped to it).
4. **PR closeout:** out-of-scope note on #1209 for workspace/erp-sync (backend tutorials — page
   builder coverage routes to #1210); tick DoD truthfully; mark ready; leave merge-ready note in
   the 0.0.5 orchestrator's worklog (it holds merge authority).

Lane: Claude subagent under the documentation exception (drift D-1); orchestrator (Tier-A)
reviews the diff before the sign-off commit; validation = opposite-family Sol `docs_audit` pass
requested via PR comment / 0.0.5 orchestrator handoff. Generator never self-certifies.

## Charter A: main-pages revamp

Page roles (the "light each deserves"):
- **Homepage** — sells NetScript in one screen: the wedge is durable, typed, full-stack apps on
  Deno with batteries (workers/sagas/streams/triggers, Aspire observability, typed web layer) —
  NOT CRUD contracts. One hero claim, three proof points, one code moment, links out. No
  duplication of core concepts.
- **Why NetScript** — the argument page: target consumer (teams building long-lived,
  service-shaped apps), contrasts vs bare Fresh/Next/Encore-style stacks, the cross-layer
  type-safety and durability story. Honest trade-offs, no marketing slop.
- **Quickstart** — fastest honest path to a running app (`netscript init` → scaffold → aspire
  start → first change); zero concept exposition beyond what the path needs.
- **Core concepts** — the mental model, once: contracts → services → plugins → web layer →
  observability; each concept links to its reference/deep-dive; absorbs whatever the homepage
  currently duplicates.

Slice split: S1 content-inventory + per-page outline (generator pair, adversarial);
S2 homepage + why (pair); S3 quickstart + core concepts (pair); S4 cross-page consistency pass;
S5 OpenCode·Grok 4.5 evaluation vs industry framework sites + final polish; S6 Sol audit + ready.

Adversarial-pair protocol: Codex Sol·low authors a draft slice; agy gemini-3.6-flash·high
critiques and counter-drafts (and vice versa per slice); each must file concrete objections
(claim-level, not tone) before convergence; orchestrator arbitrates on artifacts only (never
exit codes / agy status fields). Briefs start `use harness` + `## SKILL`.

Eval criteria (S5): distinct role per page with zero cross-page duplication; no CRUD-contract
promotion above the fold; every code sample verified against `deno doc`; prose reads human and
specific (no "seamlessly/powerful/robust" filler); comparable in tightness to best-in-class
framework front pages; homeless features linked to #1210 deep-dives, not crammed in.

Milestone: pages can land post-stable → 0.0.6 unless owner says otherwise; #1209 stays on 0.0.5.
