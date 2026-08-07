# Context pack

## Objective

Ship Canary.15 W1-A as one small draft PR directly to `main`, fully resolving #1312 and #1148.

## Current state

Draft PR #1341 is open against `main`; S0 bootstrap commit `ba862a617` and S1 commit `d04d7d325`
are pushed. S1 implements the
pre-mint budget guard, post-failure `none|partial|complete` registry observation, truthful workflow
status wording, generated-TypeScript residue coverage, and release policy docs. Focused tests and
scoped check/lint/fmt gates are green. Generator release/readiness/dry-run/dependency gates are
complete. The final artifact-only handoff commit remains.

## Protected state

- Preserve `deno.lock` without staging/restoring/regenerating.
- Do not touch foreign or quarantined worktrees.
- Do not trigger OpenHands, Billing Run, or canary publication.

## Next

Commit/push/comment the final gate/handoff artifacts, refresh the PR body/evidence, inspect
current-head CI, then stop for the separate-session IMPL-EVAL without changing draft status.
