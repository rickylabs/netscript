# Context pack — #1908 / PR #1910

## Objective

Prevent pre-#1846 runtime jobs on the original repo-wide concurrency keys from evicting jobs on
branches that carry the bounded queue policy.

## Immutable implementation

- Workflow implementation commit: `541eb914b`.
- Co-author acceptance commit: pending.
- Runtime groups: `e2e-scaffold-runtime-global-v2` and
  `e2e-scaffold-runtime-sqlite-global-v2`.
- Queue semantics remain `cancel-in-progress: false` plus `queue: max` on both tiers.

## Evidence state

- Focused workflow/classifier test: PASS, 60/60, real exit 0.
- YAML parse and exact diff evidence: PASS in `worklog.md`.
- Hosted fixed-v2 versus stale-v1 exercise: pending.
- Independent IMPL-EVAL: pending.
- CI and close-gate at immutable head: pending.

## Lifecycle state

- Issue #1908 and PR #1910 are open at `status:impl`, milestone `0.0.7`.
- PR carries `Closes #1908` and therefore remains close-gated until both issue acceptance boxes,
  all PR Acceptance/Definition-of-Done boxes, the separate-session IMPL-EVAL, and current CI pass.
- Do not merge from this lane; return an immutable merge packet to the release coordinator.
