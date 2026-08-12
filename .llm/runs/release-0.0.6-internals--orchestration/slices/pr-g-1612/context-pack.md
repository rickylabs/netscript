# PR-G #1612 Context Pack

## Objective

Replace the bare internal issue reference in the published CLI JSDoc with a short, consumer-facing
statement of the already-documented cache-provider mechanism.

## Current state

- Branch `fix/1612-published-jsdoc-codename` is based on `6aee2b414` (`origin/main` at dispatch).
- Live issue #1612 has three acceptance boxes; PR evidence maps them with `box-index: 1..3`.
- PLAN-EVAL is N/A because the defect, one-line mechanism reword, boundaries, and deterministic
  gates are fully specified by the orchestrator.
- The draft PR and implementation remain to be completed.

## Locked boundaries

Only `packages/cli/src/kernel/domain/dependency-closures/netscript-web-runtime-closure.ts` and this
slice directory may change. Do not alter the guard, fixtures, exclusions, or unrelated prose. Do
not mark the PR ready or merge it.

## Next action

Open the draft PR from the bootstrap commit, apply the one-line reword, run the specified gates,
and update the PR evidence for orchestrator-owned IMPL-EVAL.
