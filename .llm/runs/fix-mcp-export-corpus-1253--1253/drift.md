# Drift — #1253

## Authorized evaluation composition

Per owner instruction and milestone ruling D6, no local PLAN-EVAL is spawned. Evaluation composes
draft-to-ready augmentation, the OpenHands label, and the orchestrator pre-merge gate.

## Documentation corpus gap

The CLI currently supplies MCP README plus `help.md`; SDK cache/hydration/optimistic-mutation prose
is not present. This is distinct from the export corpus runtime defect and will be stated/tracked
rather than silently claimed as fixed.

Tracked as #1260 with the required taxonomy and milestone `0.0.5`.

## Inherited worktree state

The one-line `deno.lock` addition for `jsr:@netscript/queue@0.0.4` predates this branch and remains
excluded from commits.
