# Drift — 0.0.9 milestone run

| When | Planned | Actual | Why | Owner visible |
| --- | --- | --- | --- | --- |
| 2026-10-30 22:37Z | PLAN-EVAL passes before any dispatch (harness contract) | Wave 1 dispatched on a green validator; PLAN-EVAL launched in parallel | Eric: "start dispatching NOW, not tomorrow" (Cockpit relay) | supervisor.md |
| 2026-10-30 22:30Z | Plan's two topic lanes (fixes; internals/docs) | Four profile lanes: fixes, features, internals, docs; H01 placed in internals (deps/CI health) | Profile requires four exclusive lanes; spreads the 2-per-lane WIP cap over the critical path | plan.md |
| 2026-10-30 22:30Z | Plan leaf counts (A1 one shared leaf; B1 four leaves) | One leaf per issue, serialised by DAG edges or split by file ownership | Owner brief: dispatch each issue as its own leaf | plan.md |
| 2026-10-30 22:30Z | Inventory = every issue in milestone 0.0.9 | Inventory excludes the 19 `epic:design-system` issues and #2474 | Owner brief: the Fresh UI lane owns them | milestone-inventory.json `scopeNote` |
| 2026-10-30 22:30Z | Run record committed on the coordinator branch | Run record on draft PR branch `chore/release-0.0.9-orchestration` (`Refs #2474`); the orchid-branch PR with the closing line opens at run close | Orchid auto-merges a job's green PR and ends the session; precedent 0.0.8 PR #2118 | supervisor.md |
| 2026-10-31 | Lane 'fixes' for #2400 | #2400 moved to 'internals' | Fixes lane at its 2-implementing cap (#2479, #2482); #2400 is worker-runtime supervision/health, and its worker is the H01 internals worker continuing; frees a fixes slot for P0 #2395 | worklog.md |
