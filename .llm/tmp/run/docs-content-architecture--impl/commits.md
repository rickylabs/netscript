# Commits — docs/content-architecture implementation

- ecf8864f: docs(site): Phase 0a — chrome + components + landing (green Lume build)
- 323a7a1a: docs(site): wave-1b — why + quickstart prose pages render (green build)
- fb63d3b8: docs(site): Stage-6 polish — front-door P0/P1 from IMPL-EVAL PASS (green build, 85 files)
- 8bfddcad: docs(plan): synthesize SOTA doc-architecture-v2 + ground-truth (PLAN-EVAL ready)
- 045e2892: docs(plan): fold PLAN-EVAL corrections (callout tag-form, prev/next scope, jsr-audit N/A)
- 1f4c0e47: docs(site): author Tutorials ladder (first-workspace → ingest-webhook)
- 5a9d9ebe: docs(site): author How-to guides (service, db, queue/kv/cron, otel, fresh-ui, deploy, plugin)
- b3be94bc: docs(site): author Explanation pages (contracts, durable-workflows, observability, aspire)
- ccc80abe: docs(site): author Capabilities hub (services → fresh-ui, 10 pages)
- 55a6e734: docs(site): author Resources (glossary, cli-reference)
- 6fee2e33: docs(site): wire nav contract + fix landing-page dead links
- 47755efd: chore(harness): embed page inventory in doc-site authoring workflow

<!--
Step-4 authoring wave: 27 pages authored via Claude workflow (run wtdd6daob, 27/27 authored,
26/27 verify-pass). Supervisor build-gate reconciliation before commit:
  - 12 function-form callouts `{{ comp.callout({...}) }}` + orphan `{{ /comp }}` → tag form
    across tutorials/{build-a-service,durable-workflow,first-workspace}.md (Vento build-breaker);
  - 2 `function`-keyword breakers in how-to/customize-fresh-ui.md → arrow form;
  - 4 landing-page dead links (/concepts/* → /explanation/*, sagas→durable-sagas,
    workers→background-jobs) in index.vto/why.vto;
  - capabilities/database.md `no-highlight` fence → `text`.
`deno task --cwd docs/site build` GREEN — 150 files. Pushed 47755efd → origin/docs/content-architecture.
Backlog for IMPL-EVAL / Codex pass: highlight-plugin plaintext registration (_config.ts);
tutorials/getting-started.md retirement + tutorials/index.md relink; completeness-critic items
(watchers/config intent surfaces, --no-aspire CLI verification, alpha badge, footer edit-links).
-->
