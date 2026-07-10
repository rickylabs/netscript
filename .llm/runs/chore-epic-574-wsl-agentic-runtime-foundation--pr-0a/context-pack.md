# Context Pack: PR 0A canonical WSL agentic foundation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-epic-574-wsl-agentic-runtime-foundation--pr-0a` |
| Branch | `chore/epic-574-wsl-agentic-runtime-foundation` |
| Current phase | `plan` |
| Archetype | 6 — CLI / Tooling, scoped internal-tool variant |
| Scope overlays | none |

## Current State

The native WSL child worktree exists at the integration baseline with no upstream. Research, the
locked plan, and the Design checkpoint are ready for the separate PLAN-EVAL. No implementation or
machine mutation has begun.

## Completed

- Captured WSL and Windows rollback toolchain versions.
- Confirmed managed Codex remote-control process/control socket and no active worker for this run.
- Locked the #575/#576 boundary and three implementation slices.

## In Progress

- First plan commit, explicit push, early draft PR, and OpenHands PLAN-EVAL dispatch.

## Next Steps

1. Commit/push the child run and open the draft sub-PR against the integration branch.
2. Dispatch minimax-M3 PLAN-EVAL and accept implementation only after committed `PASS`.
3. Launch one attach-only GPT-5.6 Sol high Codex turn through `launch-codex-slice.ts`.
4. Post exact thread/worktree/daemon/resume identity, then resume that thread for S1.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Node 26.5.0 user-local/checksummed | Plan D1 | Latest stable at run start. |
| Google subscription Gemini auth only | Owner directive | Forbidden auth presence is classified without printing values. |
| One attach thread, same-thread implementation resumes | Plan D6 | Satisfies mobile identity and single-sender invariants. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/chore-epic-574-wsl-agentic-runtime-foundation--pr-0a/` | new | Child harness plan artifacts. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | planned | `plan.md` |
| Fitness | planned | `plan.md` |
| Runtime | planned | `plan.md` |
| Consumer | planned | `plan.md` |

## Open Questions

- Owner browser interaction may be needed for provider-native sign-in, but it does not block
  implementation, installation, doctor, or rollback work.

## Drift and Debt

- Drift: model override and component version skew recorded.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.

