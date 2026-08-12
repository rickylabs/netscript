# PR-G #1612 Context Pack

## Objective

Replace the bare internal issue reference in the published CLI JSDoc with a short, consumer-facing
statement of the already-documented cache-provider mechanism.

## Current state

- Branch `fix/1612-published-jsdoc-codename` is based on `6aee2b414` (`origin/main` at dispatch).
- Live issue #1612 has three acceptance boxes; PR evidence maps them with `box-index: 1..3`.
- PLAN-EVAL is N/A because the defect, one-line mechanism reword, boundaries, and deterministic
  gates are fully specified by the orchestrator.
- Draft PR #1614 is open with the required labels and milestone and remains draft.
- The one-line mechanism reword is complete. The codename guard, repo-wide publishable-JSDoc sweep,
  targeted and wrapper type-checks, scoped lint/format, 10 focused kernel tests, doctrine quality
  gate, and CLI doc-lint all pass.

## Locked boundaries

Only `packages/cli/src/kernel/domain/dependency-closures/netscript-web-runtime-closure.ts` and this
slice directory may change. Do not alter the guard, fixtures, exclusions, or unrelated prose. Do
not mark the PR ready or merge it.

## Next action

Commit and push the implementation evidence, update the PR body and S2 phase comment, then hand the
still-draft PR to the orchestrator for separate-session IMPL-EVAL.
