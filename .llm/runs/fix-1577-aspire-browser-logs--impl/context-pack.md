# Context Pack — fix-1577-aspire-browser-logs--impl

## Objective

Resolve #1577 by restoring default browser-log child emission for generated endpoint-bearing app
resources without affecting endpoint-less task/desktop resources.

## Current State

- Baseline and contradiction verified.
- Exact pinned API verified and awaitable.
- PLAN-EVAL recorded N/A for the mechanical slice.
- Implementation and focused/static/quality gates complete.
- Full package task: 799 pass, 3 unrelated path/missing-fixture failures; changed tests pass.
- Draft PR creation and phase handoff pending.

## Locked Constraints

- No Fable, sub-agents, local evaluator, manual OpenHands, E2E, ready-state transition, merge, or
  canary.
- Stop if `deno.lock` changes.
- Draft PR remains `status:impl` and evaluation is orchestrator-owned.

## Key Evidence

- Generated exact-package module:
  `.llm/tmp/api-probe-1577/.aspire/modules/aspire.mts` lines 22825-22828 and 24931-24967.
- Stale test uses `fixtures.MINIMAL_APP`, which is endpoint-bearing and asserts port 8000.

## Next

Commit/push, open the draft PR, apply taxonomy/milestone, and post the IMPL evidence comment.
