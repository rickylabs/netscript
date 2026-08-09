# P3 (#1210) plan — differentiator deep-dives + competitive benchmark

Scope from the issue (owner-filed) + P2's deferred list. Milestone 0.0.6. Branch
`docs/web-layer-deep-dives` off main (post #1221/#1222 merges to avoid churn).

## Slices

- **S1 — API inventory (analysis only).** Enumerate the real page-builder surface from
  `deno doc` on `@netscript/fresh/builders` (+ route/query/form/defer subpaths); produce the
  per-API sub-page list with, per API: the bare-Fresh ceremony it replaces and the idiomatic
  pattern to teach. Include the two named exemplars (withResource dedup/refinement idiom;
  Partials + deferred-loader composition) plus everything discovered. Also fold in P2's
  deferred items: the #1211 port narrative home, storefront `--service-port` trade-off,
  and the erp-sync/workspace "no Fresh surface" rationale note.
- **S2 — competitive benchmark (research).** Tutorial-flow gap analysis vs Next.js, Nuxt,
  SvelteKit, Rails-class batteries; recorded artifact: where our tutorials undersell vs
  peers, where differentiators have no peer equivalent (loudest treatment). agy/Gemini lane
  (research_extraction) if quota allows, else Claude subagent with web research.
- **S3..Sn — authoring.** One commit-slice per API sub-page under the Web Layer manual;
  type-checked examples against published entrypoints (package-side fixture per the owner's
  #1209 exception if useful); cross-links added into the phase-1 tutorial chapters at first
  point of contact.
- **Review pipeline per slice batch:** opposite-family Sol audit (docs_audit, evidence-run)
  → fix cycles → final verdict; whole-set prose pass only if the owner asks (their additional
  main-page fixes may arrive and take priority).

## Lanes

Authoring: Claude docs-exception (Opus subagents, briefs per slice). S2 research: agy · low
if quota reset, else Opus + web search. Audits: Codex Sol via launch-codex-slice (fresh
worktree per sender-ownership rule).

## Sequencing now

1. Wait for #1222 fix round 2 → re-audit PASS → ready + merge (unblocks cross-linking base).
2. S1 + S2 can start immediately (analysis/research only, no repo edits) — dispatch both.
3. Authoring starts after #1222 merges.
