# Context Pack: GitHub Copilot cloud lane for the NetScript harness

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `feat-copilot-cloud-harness--copilot-cloud-lane` |
| Branch         | `feat/copilot-cloud-harness`                     |
| Current phase  | plan                                             |
| Archetype      | `6 - CLI / Tooling`                              |
| Scope overlays | docs, GitHub workflow                            |

## Current State

Harness run activated from `origin/main` at merge commit `1c9eeef1`. The owner requested research,
plan, review, and then a harnessed Copilot integration. No implementation is authorized yet.

## Completed

- Clean worktree and branch created without touching the canonical clone's user-owned `deno.lock`.
- New typed matrix read from the merged head.
- Feature-tier deep-research route selected: Gemini 3.8 Flash high through native `agy`.
- Research generated in a separate native `agy` session, then corrected against current primary
  GitHub and OpenCode documentation.
- Copilot cloud capability preflight passed: `copilot-swe-agent` is assignable to this repository.
- Research recommendation: native Copilot CLI transport first; Cloud Agent Tasks as a measured
  implementation canary; no immediate OpenHands removal.

## In Progress

- Fable 5.1 low plan generation in a separate session.

## Next Steps

1. Generate the bounded plan and Design checkpoint.
2. Run separate-session PLAN-EVAL before implementation.
3. Implement only the ratified slices after `PASS`.

## Drift and Debt

- Drift: none.
- Debt: none accepted.
