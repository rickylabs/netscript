# analysis/C-tutorials/ — B2 output

Exhaustive current-state analysis for Topic C. Built from a first-hand, complete read of all 26
chapter files across the 5 live tutorial tracks (storefront, workspace, erp-sync, live-dashboard,
chat) plus both tutorial index pages, and a complete read of the eis-chat reference export's
`docs/` corpus (PRODUCT/ARCHITECTURE/SKILL/INDEX/HANDOVER + all 7 phase files).

## Files in this folder

- `01-current-tutorial-inventory-and-gaps.md` — per-track structure map + concrete gap list (toy vs
  real, narrative breaks, unexercised seams) for all 5 tracks.
- `02-eis-chat-build-arc.md` — eis-chat's real phase-1..7 build sequence mapped against NetScript's
  own seams; identifies which phases have a direct NetScript analogue today and which don't (a
  capability gap, not a writing gap).
- `03-docs-cut-logistics.md` — what a docs-only release cut touches (site build, nav, check:links),
  plus the full content of GitHub issue #232 (docs-to-stable umbrella) as of this run.
- `04-lume-vento-authoring-observations.md` — the shared authoring pattern (front-matter, comp tags,
  checklist/callout conventions, embedded arch-debt markers) observed identically across all 5
  tracks, plus the known Lume/Vento build landmines relevant to any rewrite.

## Relationship to matrix/ and research/

This folder assumes `matrix/C-tutorials/` (resource matrix) and `research/C-tutorials/` (external
distillation, Medusa/Astro/Rails/SvelteKit) as already written by a parallel Stage-B pass on this
same topic — see those folders' own INDEX.md. This folder does not duplicate that material; it is
the in-repo/eis-chat depth corpus those files point to.
