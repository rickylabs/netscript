use harness

## SKILL
Docs main-pages revamp, slice S1 (analysis only — NO edits to docs/site). You are half of an adversarial generator pair; another agent (Gemini) is producing a rival outline. Be concrete and opinionated; generic marketing prose is a defect.

## Task
Owner diagnosis (verbatim intent): the current schema is huge, ugly, nonsense; the front page barely sells NetScript and duplicates core concepts; it promotes CRUD contracts — the most boring feature, only useful for basic apps, miles from the target consumers.

Read the four main pages in this worktree: docs/site/index.vto, docs/site/why.vto, docs/site/quickstart.vto, docs/site/concepts.vto (plus docs/site/quickstart/ dir if relevant). Also skim docs/site/capabilities/index.md and 2–3 positioning pages (durable-workflows, services-sdk, web-layer) to know what already exists to link to instead of duplicating.

Target page roles (locked by the orchestrator plan):
- Homepage: sells NetScript in one screen — durable, typed, full-stack apps on Deno with batteries (workers/sagas/streams/triggers, Aspire observability, typed web layer). One hero claim, three proof points, one code moment, links out. NOT CRUD contracts. Zero duplication of core concepts.
- Why NetScript: the argument — target consumer (teams building long-lived service-shaped apps), honest contrasts vs bare Fresh / Next / Encore-style stacks, cross-layer type-safety + durability story, honest trade-offs.
- Quickstart: fastest honest path to a running app (netscript init → scaffold → aspire start → first change); no concept exposition beyond what the path needs.
- Core concepts: the mental model once — contracts → services → plugins → web layer → observability; absorbs what the homepage currently duplicates; each concept links out to its deep page.

Produce ONE file: .llm/runs/docs-mainpages--orchestrator/slices/mainpages-s1/outline-codex.md containing:
1. Inventory: per page, what content lives there today, what duplicates what, what promotes CRUD contracts, what is worth keeping verbatim.
2. Per-page outline to the target roles: section-by-section, with the actual hero claim wording you propose, the three proof points, and which existing deep pages each section links to.
3. The single code moment you'd put on the homepage (real API, verifiable in packages/ — name the file you verified it against).
4. Kill list: everything currently on these pages that should be deleted or moved (and where to).
Do not edit any docs/site file. Do not commit or push.
