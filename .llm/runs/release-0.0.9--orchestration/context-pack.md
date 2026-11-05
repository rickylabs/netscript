# Context pack — 0.0.9 milestone run

Read first after a compact or restart: `STATUS.md`, then `milestone-cluster-state.json` (`dispatches`, `leaves`, `reporting`), then the tail of `worklog.md`.

- Plan: `Milestone 0.0.9 Plan 2026-10-30` (planning folder) + Cockpit handover 2026-10-30. Brief wins over both.
- Scope: 53 issues (see `milestone-inventory.json`). Never touch `epic:design-system` issues or PRs #2408/#2452/#2456/#2467/#2468 beyond reading.
- Dispatch: `/swarm` comment per issue; brief text in `briefs/<issue>.md`. Orchid replies with binding comments on the issue.
- Merge gate and canary deadlines: `plan.md`.
- Validate after every transition: render, then validate with a fresh `--github-prs` export.
