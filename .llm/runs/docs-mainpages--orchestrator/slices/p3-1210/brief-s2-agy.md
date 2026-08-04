use harness

## SKILL
Research/extraction slice for NetScript #1210 phase 3. Output is a recorded gap analysis; every claim about a competitor's tutorial must come from its live official docs (fetch them), and every claim about NetScript's tutorials from the files in this worktree. No repo edits outside the single output artifact.

## Task — S2: competitive tutorial benchmark
Read NetScript's tutorial corpus in this worktree: docs/site/tutorials/ (all tracks) plus docs/site/quickstart.vto. Then research the official getting-started/tutorial flows of: Next.js (nextjs.org/learn or docs), Nuxt, SvelteKit, and one Rails-class batteries-included framework (Rails guides or Laravel bootcamp).

Produce /home/codex/repos/ns-docs-orch/.llm/runs/docs-mainpages--orchestrator/slices/p3-1210/competitive-benchmark.md:
1. Per competitor: how their canonical tutorial flow is structured (steps, first-win moment, how early they show their differentiators, how they cross-link reference docs), with URLs cited.
2. Gap analysis A — where NetScript's tutorials UNDERSELL capabilities peers highlight loudly (e.g. if peers celebrate their data-loading or form story early and ours buries it): concrete list, each with the NetScript file/chapter where the fix belongs.
3. Gap analysis B — NetScript differentiators with NO peer equivalent (candidates to verify: contract-derived end-to-end typing incl. OpenAPI+SDK, durable saga/worker runtimes in the same workspace, Aspire observed resource graph, withResource cross-layer dedup, built-in partial/deferred composition): for each, what peers offer instead and how loudly ours should be treated.
4. A prioritized recommendation list mapped to #1210's per-API sub-pages.
The file is the deliverable.
