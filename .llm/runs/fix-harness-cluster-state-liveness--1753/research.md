# Research — fix-harness-cluster-state-liveness--1753

## Re-baseline

- Carried-in source: issue #1753 and `.llm/tmp/brief.md`.
- Re-derived against `main` at `65cd8a07787504b5ed94408510d4ab85260bc21a` on 2026-08-31.
- The branch and merge base both match the requested baseline; no implementation commit is carried
  in. The run directory contained only launcher-created `codex-thread-ids.md` before bootstrap.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `validateMilestoneCluster` validates only the four internal artifacts and generated status. It has no mutable GitHub input. | `.llm/tools/harness/validate-milestone-cluster.ts:584-610` |
| 2 | State leaves require an immutable `headSha` and direct `main` base, but the validator compares neither `prNumber` nor `headSha` with the live PR. | `.llm/tools/harness/validate-milestone-cluster.ts:447-472` |
| 3 | The CLI reads only files in the run directory and passes no PR-listing/head-reading source. | `.llm/tools/harness/validate-milestone-cluster.ts:638-654` |
| 4 | Existing tests use one open leaf (`PR #200`, issue `#101`, fixes lane) and currently prove schema consistency only. | `.llm/tools/harness/validate-milestone-cluster_test.ts:50-180` |
| 5 | Live 0.0.7 search confirms multiple open direct-to-main PRs while the issue reports three absent leaves and stale allocated heads. | GitHub issue #1753 and read-only milestone PR search on 2026-08-31 |

## Intended file list

- `.llm/tools/harness/validate-milestone-cluster_test.ts`
- `.llm/tools/harness/validate-milestone-cluster.ts`
- `.llm/runs/fix-harness-cluster-state-liveness--1753/{supervisor.md,research.md,plan.md,worklog.md,context-pack.md,drift.md,codex-thread-ids.md}`

Anything outside this list is a rescope stop. During the authorized parallel window, any need to
touch `.llm/tools/agentic/` is an immediate stop.

## jsr-audit surface scan

- N/A. This changes internal harness tooling under `.llm/tools/harness/`, not a publishable package
  or plugin surface.

## Open questions

- None that force rework. A read-only JSON export supplies the production CLI adapter because the
  authorized boundary excludes `deno.json`; tests inject an in-memory source and never call GitHub.
