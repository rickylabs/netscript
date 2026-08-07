# Context pack

## Objective

Ship Canary.15 W1-A as one small draft PR directly to `main`, fully resolving #1312 and #1148.

## Current state

Draft PR #1341 is open against `main`; S0 bootstrap commit `ba862a617` is pushed. S1 implements the
pre-mint budget guard, post-failure `none|partial|complete` registry observation, truthful workflow
status wording, generated-TypeScript residue coverage, and release policy docs. Focused tests and
scoped check/lint/fmt gates are green; S1 is ready to commit/push/comment.

## Protected state

- Preserve `deno.lock` without staging/restoring/regenerating.
- Do not touch foreign or quarantined worktrees.
- Do not trigger OpenHands, Billing Run, or canary publication.

## Next

Commit/push/comment S1, run the selected release/dependency generator gates once, update PR evidence
and run artifacts, then hand off without self-certifying.
