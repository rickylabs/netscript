# Context Pack: generated Fresh Markdown clean-runner build

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-790-md-hydration-ci--codex` |
| Branch | `fix/790-md-hydration-ci` |
| Current phase | `plan — owner-authorized evaluator override` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Current State

The GitHub job log and an isolated local Deno cache reproduce the same production-build failure:
Fresh core's versioned npm import of `@preact/signals` is not resolved by Vite on a clean runner.
The existing NetScript Vite plugin owns Preact runtime identity but currently excludes Signals.

## Completed

- Loaded requested skills, harness workflow, doctrine, frontend overlay, and JSR rubric.
- Verified clean branch/base/worktree identity.
- Read GitHub job `87754952044` through the repository token resolver.
- Reproduced the failure with an isolated `DENO_DIR`.
- Locked the plan and Design checkpoint without source edits.

## In Progress

- S0 artifact commit, explicit push, and draft PR opening.

## Next Steps

1. Add the red resolver regression.
2. Implement Signals canonicalization/dedupe and explicit build diagnostics.
3. Run focused, isolated-cache, scoped, quality, and CI gates.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Vite resolver is the owner | CI log + existing `@netscript/fresh/vite` Preact policy | Avoids a test-only cache warm-up. |
| Peer warning is non-causal | full job log | Do not broaden into dependency changes. |
| No evaluator dispatch | explicit owner constraint | This lane does not self-certify. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/fix-790-md-hydration-ci--codex/**` | new | Harness research, plan, design, and evidence. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | planned | touched-root wrappers after S1 |
| Fitness | planned | quality/architecture/package surface after S1 |
| Runtime | baseline failure reproduced | GitHub job + isolated-cache local run |
| Consumer | baseline failure reproduced | generated Fresh production build |

## Open Questions

- None blocking implementation.

## Drift and Debt

- Drift: evaluator dispatch reserved to supervisor; warm cache masked the failure.
- Debt: none planned.

## Commits

- See the draft PR's commit list + per-slice PR comments after S0.

