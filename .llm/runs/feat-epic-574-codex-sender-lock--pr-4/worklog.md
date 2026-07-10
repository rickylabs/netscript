# Worklog: Codex sender ownership and remote recovery

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-epic-574-codex-sender-lock--pr-4` |
| Branch | `feat/epic-574-codex-sender-lock` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` |

## Design

### Public Surface

- Existing `deno task agentic:runtime repair codex-remote --worktree <path> [--session <id>] [--dry-run] [--json]` becomes functional.
- Existing runtime `launch` refuses duplicate ownership before its process request executes.
- Existing runtime `resume` remains the sole steering path for an owned thread.

### Domain Vocabulary

- `SenderOwnershipRecord` / `SenderOwnershipState` — durable privacy-safe owner identity and lifecycle.
- `SenderOwnershipDecision` — acquired, blocked-with-resume, stale-reclaimable, or invalid.
- `CodexRemoteState` — managed, unmanaged, stale socket, disconnected, version skew, or absent.
- `CodexRemoteObservation` — versions, socket/control facts, anchored PIDs, sessions, and child commands.
- `CodexRepairDecision` / `CodexRecoveryEvidence` — refusal or ordered recovery with redacted verification.

### Ports

- Ownership store/process observation — atomic create/read/replace/release and owner liveness without hidden globals.
- Remote-control inspection/mutation — injected process/socket/restart/pair/verify operations so tests never touch the real daemon.

### Constants

- Sender ownership schema version and finite ownership states.
- Finite Codex remote states.
- Anchored app-server argv rule rooted below `$HOME/.codex/`.
- Single known control socket relative path.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Lock research, design, safety, and slice boundaries. | Plan artifact checks | run-dir artifacts |
| 2 | Prove durable single-sender launch ownership and resume steering. | focused ownership/adapter/controller tests + scoped wrappers | runtime contracts/ports, ownership implementation/tests, Codex adapter/controller tests, run artifacts |
| 3 | Prove explicit daemon diagnosis and anchored active-work-safe recovery; document operator use. | full agentic/runtime suite + scoped wrappers/integrity gates | remote-control implementation/tests, planner/controller/CLI/output as needed, README, run artifacts |

### Deferred Scope

- #581 routing/global defaults and #582 rollout/model promotion.
- Actual mobile/sleep/network reconnect execution; owner-accepted-working only.

### Contributor Path

Start at `runtime/contract.ts` for canonical vocabulary, follow the action into `runtime/planner.ts`, then the focused ownership/remote-control module and injected adapter; extend behavior with a semantic fixture test before changing an edge.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-07-10 | 1 | pre-flight | Explicit fetch succeeded after stale local origin refspec failed; ancestry exit 0; one pre-existing untracked thread-id artifact preserved. |
| 2026-07-10 | 1 | design | Research and plan recorded; implementation is stopped pending separate coordinator Plan-Gate. |
| 2026-07-10 | 1 | Plan-Gate | External Claude coordinator approved the locked plan; slice 2 implementation authorized. |
| 2026-07-10 | 2 | implementation | Added strict sender ownership domain/atomic store and pre-spawn duplicate refusal with resume guidance. |
| 2026-07-10 | 2 | reconcile | #580 remains the only owned issue; #581/#582 surfaces are unchanged. PR #589 remains draft pending coordinator review. |
| 2026-07-10 | 3 | implementation | Added six-state Codex remote diagnosis, active-work/unanchored refusal, injected anchored repair, verification/evidence, CLI apply/dry-run, launcher-edge atomic ownership, and operator README. |
| 2026-07-10 | 3 | reconcile | #581 routing/global defaults and #582 rollout/model promotion remain absent; interactive reconnect canaries remain owner-accepted rather than executed evidence. |

## Gate Results

| Gate | Result | Notes |
| ---- | ------ | ----- |
| PLAN-EVAL | PASS | External coordinator approval recorded in `plan-eval.md`; worker does not self-certify. |
| Slice 2 focused tests | PASS | 15 passed, 0 failed; exit 0. |
| Slice 2 scoped check | PASS | 45 files, 0 findings; exit 0. |
| Slice 2 scoped lint | PASS | 45 files, 0 findings; exit 0. |
| Slice 2 scoped fmt | PASS | 45 files, 0 findings; exit 0. |
| Slice 2 diff/lock | PASS | `git diff --check` exit 0; `deno.lock` unchanged. |
| Slice 3 focused tests | PASS | 33 remote/planner/controller/boundary tests + 2 compatibility + 4 ownership passed; 0 failed; exits 0. |
| Slice 3 launcher check | PASS | `deno check --no-lock launch-codex-slice.ts`; exit 0. |
| Slice 3 scoped check | PASS | 48 files, 0 findings; exit 0. |
| Slice 3 scoped lint | PASS | 48 files, 0 findings; exit 0. |
| Slice 3 scoped fmt | PASS | 48 files, 0 findings; exit 0. |
| Slice 3 diff/lock | PASS | `git diff --check` exit 0; `deno.lock` unchanged. |
| Final full agentic/runtime suite | PASS | 185 passed, 0 failed; exit 0. |
| Final scoped check | PASS | 48 files, 0 findings; exit 0. |
| Final scoped lint | PASS | 48 files, 0 findings; exit 0. |
| Final scoped fmt | PASS | 48 files, 0 findings; exit 0. |

## Final DoD Reconciliation

- Duplicate launcher ownership is acquired atomically immediately before spawn; owned worktrees refuse with resume guidance.
- Managed/unmanaged/stale-socket/disconnected/version-skew/absent states have semantic tests.
- Active sessions, active child commands, and unanchored app-server processes block every repair mutation.
- The production adapter uses per-PID `Deno.kill` only after repeated anchored argv validation and exact known-socket equality; no broad kill implementation exists.
- Repair verification must return connected, version-aligned managed state before redacted evidence persists.
- README covers command, dry-run, ownership/reclaim semantics, and anchored repair guarantees.
- #581/#582 absence regression is green. Interactive reconnect canaries remain owner-accepted-working, not fabricated.
- PR #589 is open, draft, merge-state clean, and awaiting coordinator Tier-A review; this worker has not merged or self-certified.

## Handoff Notes

- Review L2–L9 first: lock schema/liveness and repair anchoring/refusal are the decisions that would force rework.
- Interactive reconnect canaries are owner-accepted only and must not be reported as raw executions.
- Tier-A should inspect `isAnchoredCodexAppServer`, the repeated PID allowlist in `terminateAnchored`, the exact socket comparison, and active-session/child-command refusal first.
