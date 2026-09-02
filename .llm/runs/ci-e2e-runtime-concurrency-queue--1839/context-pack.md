# Context Pack: e2e-cli runtime concurrency queue

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `ci-e2e-runtime-concurrency-queue--1839` |
| Branch | `ci/e2e-runtime-concurrency-queue` |
| Current phase | `gate` / exact runtime acceptance deferred |
| Archetype | N/A — CI workflow infrastructure |
| Scope overlays | none |

## Current State

The workflow implementation and live no-op simulation are complete. Both runtime groups retain
their global mutex and now use `queue: max`; the header documents bounded pending admission and
head-stable re-entry. The three-run simulation establishes those scheduler semantics generally, but
it did not exercise three `e2e-cli-gate` PRs or either actual runtime tier. Issue acceptance boxes
1, 2, 3, and 5 are therefore deferred; only the documented-mechanism box has direct evidence.

## Completed

- Read the named skills and mandatory harness workflow/gate references.
- Verified exact base/branch and unchanged `deno.lock`.
- Read issue #1839 and current `e2e-cli.yml` concurrency blocks.
- Selected the native bounded queue and designed a no-op timestamp simulation of the scheduler
  primitive.
- Opened draft PR #1846 with `Closes #1839`, milestone 0.0.7, and final `status:impl` taxonomy.
- Added/documented `queue: max` on both runtime-tier job groups.
- Simulated three arrivals within 2 seconds: one ran while two were simultaneously pending; all
  three later succeeded with non-overlapping job timestamps.
- Proved each standalone simulation run kept its triggering head SHA and entered without another
  push; this is not evidence about the eventual three `e2e-cli-gate` PR heads.
- Prepared `exact-runtime-proof-procedure.md` without opening proof PRs or consuming runtime slots.

## Deferred

- Exact three-arrival proof against both actual runtime tiers, pending the owner's explicit release
  after the Aspire runtime queue drains.
- Separate-session exact-head IMPL-EVAL is owner-controlled and targets `a8f3f9e81`. This
  artifact-honesty correction is later and must not inherit that verdict.

## Next Steps

1. Stop after correcting the artifacts and PR record; do not alter draft status or labels.
2. Wait for the owner to confirm the Aspire queue has drained and explicitly release the proof.
3. Execute the prepared procedure exactly, then mirror all five acceptance boxes with actual run,
   job, timestamp, and head evidence.
4. Leave ready-for-review, exact CI, and evaluation transitions to the owner.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Native `queue: max` | GitHub concurrency docs | Preserves the existing global mutex and retains up to 100 pending jobs. |
| Scratch live simulation | owner brief + audit ruling | General scheduler proof only; no real runtime resource use and no box 1 claim. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/ci-e2e-runtime-concurrency-queue--1839/**` | new | Harness identity, research, plan, and evidence ledger. |
| `.github/workflows/e2e-cli.yml` | changed | Header policy and two native bounded queue settings. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | PASS | diff, queue/header, scope, and lock assertions exited 0 |
| Fitness | N/A | workflow-only |
| Runtime | DEFERRED | exact three-PR/two-tier execution awaits owner release |
| Consumer | PASS (general mechanism only) | live standalone queue and simulation-head evidence |

## Open Questions

- When will the owner release the exact proof after confirming the Aspire runtime queue is empty?

## Drift and Debt

- Drift: audit-corrected acceptance scope, owner-controlled evaluation handoff, and missing `rtk`
  binary recorded.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
