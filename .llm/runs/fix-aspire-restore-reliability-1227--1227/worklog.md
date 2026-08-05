# Worklog

## Design

- Public surface: E2E gate definition/results and pretty report only; no product CLI API changes.
- Domain vocabulary: per-gate timeout, `infrastructure` failure class, bounded retry attempts.
- Ports: existing command executor and reporter ports.
- Constants: Aspire restore timeout/attempt budget and exact workflow cache key.
- Commit slices: retry/classification; workflow cache; validation/handoff.
- Deferred scope: upstream NuGet/Aspire behavior and release-policy consumption.
- Contributor path: define exceptional infrastructure behavior beside the runtime gate, prove the generic contract in command-gate tests, and render it in reporter tests.

## 2026-08-05

- Read issue #1227 first and re-baselined against current `origin/main`.
- Confirmed the 2 × 900-second behavior in code.
- Selected a 3 × 180-second bounded restore budget and an exact-version NuGet cache.

### S1 — bounded restore and classification

- Added opt-in per-gate command timeouts and a three-attempt ceiling.
- Configured only `runtime.aspire-restore` for 3 × 180 seconds and the stable
  `infrastructure` failure class.
- Pretty reports now print the final failure class beside all attempt durations.
- Focused command/runtime/reporter tests passed.
- Reconcile: #1227 remains the sole closing issue; scope and milestone are unchanged.

### S2 — exact pinned package cache

- Added `actions/cache@v4` for `~/.nuget/packages` to both PR runtime jobs and the published/prod-local canary jobs.
- The cache key includes runner OS and exact Aspire 13.4.6 train; there is no cross-version restore key.
- Added a workflow policy regression asserting all four runtime jobs carry the same exact cache contract.
- Focused workflow policy test passed.
- Reconcile: the fresh canary evidence changes urgency, not scope; #1227 remains p1 in 0.0.5.

### S3 — validation and handoff

- E2E unit surface plus cache policy: 108 passed.
- Focused changed-surface regressions: 24 passed.
- Scoped check: 122 files; lint: 122 files; fmt: 126 files; all clean.
- Three workflow YAML files parse successfully. `actionlint` was unavailable locally; the cache
  policy regression validates the owned semantic invariant.
- `quality:scan` passed. `arch:check` passed with pre-existing repository warnings only.
- No live scaffold runtime was launched; the orchestrator pre-merge gate owns expensive runtime proof.
- Reconcile: issue acceptance and PR body align; all three boxes are earned.
