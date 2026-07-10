# Context pack: rollout canaries + outcome report (#582)

## Current state

- Phase: Plan & Design complete; hard stop awaiting separate coordinator PLAN-EVAL.
- Branch/worktree: `feat/epic-574-rollout-canaries` at
  `/home/codex/repos/netscript-epic-574-pr6-rollout`.
- Baseline: `b438f16d`; ancestry verified.
- Generator: daemon-attached WSL Codex thread recorded in `codex-thread-ids.md`.
- Evaluator/sign-off: Claude coordinator; this worker does not self-certify.

## Locked scope

Build a thin rollout runner that orchestrates shipped #576–#581 CLIs, emits a secret-safe nine-row
JSON matrix, and renders a human outcome report with residual risks, rollback status, and a
recommendation only. Interactive/mobile claims are owner-accepted evidence. Universal promotion,
merge, and behavioral changes to earlier slices are prohibited.

## Planned slices

1. Pure finite contract, aggregation, and redaction.
2. Thin injected runner plus live checked-in matrix.
3. Human outcome report and final DoD evidence.

## Resume rule

Do not implement until `plan-eval.md` contains a separate-session `PASS` and the coordinator resumes
this thread. After resume, execute one slice at a time with focused tests, scoped wrappers,
diff/secret/lock gates, explicit-refspec push, PR comment, and Tier-A review.
