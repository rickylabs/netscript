# Context pack — test-fresh-partial-nav-browser--1590-s2

## Current state

- Repair baseline is `fd8e0f5be`; local `e6ff1c6e1` adds only the checked-in repair brief.
- The hosted wait failure is re-baselined: a held request reaches the fixture, Fresh 2.3.3 adds
  `fresh-partial=true` for both activation paths, and the coordinator forwards that URL unchanged.
- The proof now synchronizes stale setup on explicit server barrier arrival, records all stale-phase
  request/response URLs, and defers response/EOF checks until explicit barrier release.
- `packages/fresh/src`, `packages/fresh/deno.json`, workflows, and `deno.lock` remain untouched.
- Hosted Chromium evidence is intentionally not run on this worker and remains pending at the
  repair commit.

## Supervisor next actions

1. Review the stale-phase barrier synchronization and URL-trace assertions.
2. Trigger/watch the hosted `fresh-browser` durable gate at the exact repair commit.
3. Keep the existing publish-filter adjudication in `drift.md` visible for merge readiness.
4. Dispatch a fresh opposite-family IMPL-EVAL session after hosted green. Add `Closes #1590` only
   after the hosted gate and remaining acceptance are verified.

## Required PR metadata

`orchestrator:features`, `status:impl`, `type:test`, `priority:p1`, `wave:v1`, `area:fresh`;
milestone `0.0.7`.
