# Context pack

## Objective

Ship Canary.15 W1-A as one small draft PR directly to `main`, fully resolving #1312 and #1148.

## Current state

Research/design locked against current issues and declared `origin/main`. Bootstrap is ready for
the required first commit and draft PR. No implementation files have been touched.

## Protected state

- Preserve `deno.lock` without staging/restoring/regenerating.
- Do not touch foreign or quarantined worktrees.
- Do not trigger OpenHands, Billing Run, or canary publication.

## Next

Commit/push the run bootstrap, open and label the draft PR, then land the contract-first focused
release-tooling slice and hand off for independent IMPL-EVAL.
