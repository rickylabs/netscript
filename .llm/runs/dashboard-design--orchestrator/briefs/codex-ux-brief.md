use harness

## SKILL

netscript-harness · netscript-doctrine (read-only grounding). This is an ANALYSIS-ONLY slice:
you change NO product code. All output goes under
`/home/codex/repos/ns-ddr-codex/.llm/runs/dashboard-design--orchestrator/analysis/`.

# Adversarial UX/DX pass — NetScript Dev Dashboard prototype (design revamp run)

You are the adversarial UX/DX evaluator for the dev-dashboard design revamp
(umbrella PR #685, branch `design/dev-dashboard-revamp`). Your SOLE role is user/developer
experience. You must answer two questions, hard and honestly:

1. **HOW FAR AHEAD OF THE COMPETITION IS THIS DASHBOARD?** Rate the current prototype
   against the best-in-class dev consoles (Encore dev dashboard + Flow, Temporal Web UI,
   Inngest, Trigger.dev, Appwrite console, Directus, Supabase Studio, Convex dashboard,
   the new Aspire "Deck" React dashboard — see
   `.llm/runs/dashboard-design--orchestrator/reference/aspire-deck-research.md`).
   Per screen and overall: where does it lead, where does it merely match, where does it
   trail? Be adversarial: a screen that "holds gates" can still be mediocre UX.
2. **HOW MUCH OF NETSCRIPT'S HIGHLIGHT FEATURES DOES IT COVER?** Inventory NetScript's
   differentiating capabilities (from the repo: packages/, plugins/, docs/architecture/
   doctrine, and `.llm/runs/dashboard-design--orchestrator/design-project/feedback/POC-ground-truth.md`)
   and score prototype coverage. Name every highlight feature that is invisible or
   under-sold in the prototype (e.g. polyglot task runtimes, contract duality, typed route
   contracts, runtime-config versioning, durable streams, auth projections, AI tool
   registry, plugin contribution axes).

## Your inputs (all committed on your branch `design/ddr-s3-codex-ux`)

- `.llm/runs/dashboard-design--orchestrator/screen-catalog.md` — ground-truth catalog.
- `.llm/runs/dashboard-design--orchestrator/screenshots/*.png` — 17 full-page captures.
- `.llm/runs/dashboard-design--orchestrator/improvement-brief.md` — the six owner axes;
  your findings must be organized against them.
- `.llm/runs/dashboard-design--orchestrator/design-project/` — prior adversarial review
  (13 screens), POC ground truth, v2 design prompts, rescope research.
- `.llm/runs/dashboard-design--orchestrator/prototype/` — the prototype source; you can
  re-render it: serve that dir over HTTP, open `NetScript Dev Dashboard.dc.html#/<route>`
  (route list in the catalog), wait ~2.5 s (loads React from unpkg).
- Reference apps (read-only, ALREADY CLONED):
  - `/home/codex/repos/refs/netscript-start` — playground dashboard: study
    `apps/playground/routes/(dashboard)/dashboard/{plugin,framework}` routing + UX.
  - `/home/codex/repos/refs/eis-chat` — production-grade chat app: frontend routing and
    AI-surface patterns.

## Seed findings from the owner (treat as confirmed, expand on them)

(a) The playground's jobs / polyglot tasks / sagas / streams routing experience is MUCH
better than the prototype's flat 15-route hash router — identify exactly which routing/
navigation/list-detail patterns should be stolen and adapted.
(b) The prototype's AI surface (`ai` route) is underwhelming vs the reference chat app.
The owner does NOT want a generic chat: they want AI capability distributed as actions,
dynamic triggers, context augmentation, and embedded assists across panels. Assess the gap
concretely against what the chat app ships.

## Deliverables (commit to your branch, run dir only)

1. `analysis/codex-ux-dx-verdict.md` — the two headline answers with a scored
   competitive matrix (screen × competitor), the highlight-feature coverage table
   (feature → covered/undersold/absent → evidence), and a ranked list of the 15 highest-
   leverage UX/DX changes for the revamp (each: what, why, which axis, which screen(s)).
2. `analysis/codex-routing-steal-list.md` — concrete routing/UX patterns from the two
   reference apps worth stealing (cite file paths), adapted to the dashboard's screens.

Rules: analysis only — no changes outside `.llm/runs/dashboard-design--orchestrator/`;
never mention the reference apps' names as required public naming (internal grounding is
fine in these analysis docs); do not push to main; commit on `design/ddr-s3-codex-ux` and
push that branch when done. Honest artifacts; never fabricate evidence; cite file paths
for every claim about the repos.
