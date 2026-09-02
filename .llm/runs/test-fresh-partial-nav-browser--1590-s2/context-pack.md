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

## 2026-09-02 implementation handoff

- Baseline verified clean at `cb02a24cf`; the browser proof remains exactly 500 lines.
- The post-final heading observer is page-owned and spans the same pre-release through post-settle
  window. Before page close, an idempotent cleanup run releases both barriers and waits for
  released + all-arrived-completed + zero-cancellation fixture state.
- Scoped check/lint/fmt passed for 211 files; Fresh source tests passed 254/254. `deno.lock` remains
  at SHA-256 `a269308a7cfd304e04377fbd9ef81d51edf629589aa741e18d367652dcdb2bcd`.
- `playwright-cli` is unavailable locally, so no browser or hosted proof was run. The supervisor
  must run the hosted `fresh-browser` gate at the pushed repair SHA before acceptance.
