# Context pack — test-fresh-partial-nav-browser--1590-s2

## Current state

- Baseline/HEAD before sign-off: `102ef8a10` on `test/fresh-partial-nav-browser-proof`.
- Five planned code files are implemented; `packages/fresh/deno.json`, product source, workflows,
  and `deno.lock` are untouched.
- Static/scoped tests and doctrine gates are green. Hosted Chromium evidence is intentionally not
  run on this worker.
- The implementation lane has not committed, pushed, opened the PR, or self-certified the slice.

## Supervisor next actions

1. Review the five-file proof and the significant publish-filter drift in `drift.md`.
2. Decide whether to authorize a `packages/fresh/deno.json` publish-exclusion adjustment or accept
   the current publish surface explicitly; the implementation lane must not infer that decision.
3. Perform Tier-A sign-off, commit, explicit-refspec push, and open the draft PR with the requested
   metadata and `Refs #1590` (no closing keyword).
4. Trigger/watch the hosted `fresh-browser` durable gate at the exact commit.
5. Dispatch a fresh opposite-family IMPL-EVAL session. Add `Closes #1590` only after the hosted gate
   is green and remaining acceptance is verified.

## Required PR metadata

`orchestrator:features`, `status:impl`, `type:test`, `priority:p1`, `wave:v1`, `area:fresh`;
milestone `0.0.7`.
