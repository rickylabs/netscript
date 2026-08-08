use harness

## SKILL
Docs main-pages revamp, slice S1 (analysis only — NO edits to docs/site). You are half of an adversarial generator pair; another agent (Codex) is producing a rival outline. Be concrete and opinionated; generic marketing prose is a defect.

## Task
Owner diagnosis (verbatim intent): the current schema is huge, ugly, nonsense; the front page barely sells NetScript and duplicates core concepts; it promotes CRUD contracts — the most boring feature, only useful for basic apps, miles from the target consumers.

Read the four main pages: docs/site/index.vto, docs/site/why.vto, docs/site/quickstart.vto, docs/site/concepts.vto (plus docs/site/quickstart/ if relevant). Also skim docs/site/capabilities/index.md and 2–3 positioning pages (durable-workflows, services-sdk, web-layer) to know what exists to link to instead of duplicating.

Target page roles (locked): Homepage sells in one screen (durable, typed, full-stack apps on Deno with batteries — workers/sagas/streams/triggers, Aspire observability, typed web layer; one hero claim, three proof points, one code moment; NOT CRUD contracts; zero duplication of core concepts). Why NetScript = the argument (target consumer, honest contrasts vs bare Fresh/Next/Encore-style stacks, cross-layer type-safety + durability, honest trade-offs). Quickstart = fastest honest path to a running app (netscript init → scaffold → aspire start → first change). Core concepts = the mental model once (contracts → services → plugins → web layer → observability), absorbing homepage duplication, linking out per concept.

Write ONE file: .llm/runs/docs-mainpages--orchestrator/slices/mainpages-s1/outline-agy.md with: (1) per-page inventory — what lives there, what duplicates what, what promotes CRUD contracts, what to keep; (2) per-page outline to the target roles with actual proposed hero-claim wording, three proof points, and per-section links to existing deep pages; (3) the one homepage code moment (real API — name the source file in packages/ you verified against); (4) kill list of content to delete/move and where. Do not edit docs/site. Do not commit or push.
