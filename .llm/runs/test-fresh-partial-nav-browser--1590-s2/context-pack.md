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

## 2026-09-02 hydration-safe remount handoff

- Supervisor run `33618955184` / job `100211358097` proved the page-context observer and pre-close
  drain fixes at `31f4ff8a1`; Vite stderr was empty and execution reached assertions.
- The remaining marker failure is determination **(a)**. Resolved Fresh 2.3.3 source shows nested
  comment markers are parsed into keyed `PartialComp` VNodes and are not durable hydrated-DOM nodes.
- The exact A→B→A marker assertion now reads the page's three relevant fetched HTML bodies. Two
  page-side expando checks independently require region node replacement across both name changes,
  with B re-tagged after its same-name update to isolate B→A.
- Local check/lint/fmt processed 211 files with no findings; source tests passed 254/254;
  `quality:gate` and the three-response fixture marker probe exited 0. The proof remains 500 lines
  and the lock SHA-256 remains `a269308a7cfd304e04377fbd9ef81d51edf629589aa741e18d367652dcdb2bcd`.
- No local or hosted browser proof was run in this lane because `playwright-cli` is unavailable and
  hosted execution remains supervisor-owned. Run hosted `fresh-browser` at the pushed repair SHA.

## 2026-09-03 convergence handoff

- Merged current `origin/main` into the IMPL-EVAL-PASS head `d0bf0aebf`. The sole conflict kept
  main's shared locked browser-runtime helpers and all three existing browser scenarios, including
  the complete Slice 2 partial-navigation proof.
- The partial fixture still captures Vite stdout/stderr, but its launcher now uses main's
  frozen/cached-only `createLockedViteCommand`; no #1856 runtime type change affected the proof.
- Fresh check passed with 217 files and 0 diagnostics; Fresh units passed 280/280. All requested
  generation, asset, Aspire parity, README fence, architecture, and quality gates exited 0.
- Generated outputs and `deno.lock` exactly match `origin/main`. `playwright-cli` remains absent, so
  the supervisor/CI must run the durable `fresh-browser` job at the pushed merge SHA.
