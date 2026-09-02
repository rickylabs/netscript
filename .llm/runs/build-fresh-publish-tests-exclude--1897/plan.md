# Plan

- Archetype: 4, Public DSL / Builder; no scope overlay because no Fresh runtime/UI/source behavior changes.
- Doctrine verdict: Keep.
- PLAN-EVAL: N/A — issue #1897 supplies the exact scope, alternatives, acceptance criterion, and gate set for this one-line metadata fix.

## Locked decision

Add `"tests/"` as a new first item in `packages/fresh/deno.json`'s existing `publish.exclude` array. Do not reorder or copy #1895's concurrent patterns. This excludes all test-only files and minimizes the shared-array merge surface.

## Open-decision sweep

- No must-resolve decisions remain.
- Safe to defer: none.

## Slice

1. Exclude the test tree and prove the publish set is clean. Files: `packages/fresh/deno.json` and this run directory. Gates: before/after publish enumeration, scoped check, source tests, three carrier checks, package quality/doctrine checks, lock hash.

## Risks

- Consumer file accidentally lives under `tests/`: mitigated by `deno doc` over all exports and targeted entrypoint-module grep.
- Conflict with #1895: mitigated by a single additive line without reformatting or importing its changes.
- Validation lock churn: mitigated by before/after SHA-256 and diff inspection.

## Deferred and prohibited scope

- No source edits, relocations, other package configs, Aspire, Docker, browser gates, or CLI E2E.
- No architecture debt is introduced or deepened.
