# T2-B preflight — #1115 / PR #1318

Observed on 2026-08-06 before the T1 dependency opened:

- PR head and local worktree are exact at `d2a900c7d8f94d8ed608450164c1ab678face149`.
- Against current `canary/0.0.5-canary.14@2508eb8c9`, the branch is 4 commits behind and 5 ahead.
- PR is open, non-draft, mergeable, `status:ready-merge`, and all current hosted substantive lanes
  are green; review-thread gate is 0/0.
- Issue #1115 remains open in milestone 0.0.5 with all six acceptance rows checked, but its issue
  lifecycle remains stale at `status:triage`.
- PR body and tracked run still identify canary.13 as the base.
- Existing tests report 41 Codex/compatibility cases and 89 focused shared-state/failure cases, but
  the tracked evaluator artifact explicitly leaves separate IMPL-EVAL pending.

## Required post-T1 supervisor mission

1. Re-query the live PR, issue, train head, hosted contexts, and review threads before mutation.
2. Protect the unowned lock state, then integrate the exact post-T1 canary.14 train without force
   push and resolve only T2-B-owned conflicts.
3. Re-prove live rollout following and evidence-derived working/idle/stalled/dead/refused state with
   fake-clock fixtures, shared thread resolution, append-stream termination, and negative controls.
4. Re-prove mixed Codex/agy worktree resolution, transcript recency, issue/current-step extraction,
   non-zero exit reporting, and commit/file artifact evidence. Use sanitized fixtures for stable
   gates and a bounded real-runtime observation only where the acceptance contract requires it.
5. Run focused agentic tests, scoped check/lint/fmt, tooling/docs accuracy gates, acceptance
   mirror/close gate, prohibited-source scan, and any broader gate required by the integrated diff.
6. Correct stale canary.13 wording and record exact current-head evidence.
7. Leave the PR draft or at `status:impl-eval` for a fresh separate Qwen evaluator; do not merge,
   publish, or self-certify.

At launch, the final implementation prompt must start with `use harness`, include a `## SKILL`
chapter naming `netscript-harness`, `netscript-pr`, `netscript-tools`, `netscript-deno-toolchain`,
`rtk`, and the agentic-runtime portions of the repository tooling guidance, and carry the exact
worktree/branch/base/head plus the complete Codex launch-evidence contract.
