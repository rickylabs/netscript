# Context Pack: verify-canary-pair permission fix

## Current State

The immutable-tag correction is complete. Trusted `publish.yml` directly owns the exact `git,deno` verifier invocation, so recovery does not consult the checked-out tag's old task; `deno.json` remains aligned for current/future callers. Permission failure remains distinguishable from genuine content drift. The focused recovery/verifier suite is 38/38, and the previously requested root gates remain green.

## Key Decisions

- Trusted `publish.yml` must own its direct executable grant because recovery checks out an immutable older tag; `deno.json` separately mirrors the same exact grant for current/future callers.
- Deno permission denial must bypass the content-drift rewrite.
- PLAN-EVAL is N/A for this small, fully specified fix; IMPL-EVAL remains automatic and owner-triggered.

## Completed

- Pre-fix RED captured for error classification and exact permission set; immutable-tag failure is reproduced by an executed old-task negative control.
- Workflow recovery simulation bypasses the old task and reaches production fail-closed content logic.
- Focused and root gates passed.
- Lock files unchanged.

## Next Steps

1. Amend and push the corrected slice to draft PR #1635.
2. Post the corrected evidence without changing labels or readiness.
3. Stop without triggering evaluation or merging.

## Drift and Debt

- Drift: none.
- Debt: none expected.
