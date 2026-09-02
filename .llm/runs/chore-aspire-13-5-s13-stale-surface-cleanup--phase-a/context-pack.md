# Context Pack: S13 stale surface cleanup

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-aspire-13-5-s13-stale-surface-cleanup--phase-a` |
| Branch | `chore/aspire-13-5-s13-stale-surface-cleanup` |
| Current phase | `gate — D-155 corrected-stack verification complete; push pending` |
| Archetype | `6 — CLI / Tooling` plus MCP Archetype 2 seam |
| Scope overlays | `docs` |

## Current State

D-155 replayed S13's nine commits from old baseline `a46ea16d` onto corrected S10 head `c9e3fcbe8`.
All ruled resolutions are applied, the post-deletion manifest is regenerated, and the requested
static gates pass. The prior IMPL-EVAL remains historical evidence only; the supervisor owns the
separate post-push GLM IMPL-EVAL and this lane does not modify `evaluate*.md`.

## Completed

- Required skills, harness workflow, contract, doctrine, and relevant predecessor handoffs read.
- Design checkpoint and owner-escalated PLAN-EVAL disposition recorded before implementation.
- Slice 1 RED tests written and reproduced with the structured wrapper (exit 1 on the missing
  Aspire-ps adapter and resolver port/source contract).
- D-17 resolver, injected Aspire-ps runtime-edge reader, owned stale-surface cleanup, regenerated
  carriers, and parity phase 2 implemented in commit-by-slice history.
- Cycle-1 generated-consumer finding remediated at `fc0a0c8c`; focused tests and consumer checks
  prove the public JSR and local scaffold mappings.
- All required static, fitness, freshness, consumer, doctrine, and report-mode parity gates passed.
- Independent IMPL-EVAL cycle 2 session `b7095b3b-13aa-466e-895f-c560309a4e48` returned `PASS`
  against exact implementation head `fc0a0c8ccc02ed8f741931de3455e7778df8697d`.
- Final host postflight: `aspire ps --format Json --nologo --non-interactive` returned `[]` and
  `docker ps -a` returned empty; no runtime was started.
- Tier-A correction regenerated the MCP export corpus after the D-17 public-surface change. The
  export corpus, publish assets, and asset barrel freshness gates pass; MCP tests pass 139/139.
- D-155 ancestry and range-diff checks pass: corrected S10 is the exact merge-base, all nine S13
  commits map in order, and none of 36 stale old-lineage commits is present.
- Current-main's parity base contract and exact-token tests coexist with S13 phase 2; the focused
  suite passes 13/13. The exact task retains `--allow-read` and adds only `--allow-run=git`.
- Post-deletion manifest regeneration produced 815 rows with zero unmatched paths; parity reports
  `fail: 0`, `missing: 0`, and `manifestFresh: true`.
- Changed-source check/lint/fmt, `quality:gate`, asset freshness, and the 2,982-file repo-wide check
  all pass; the repo-wide check reports 25 batches and `failedBatches: 0`.

## In Progress

- Amend the ninth replayed commit with the regenerated manifest and D-155 run evidence, then
  force-push with a freshly verified remote lease.

## Next Steps

1. Supervisor dispatches the separate GLM IMPL-EVAL after the corrected branch is pushed.
2. Coordinator performs the remaining close-gate and merge coordination without retargeting this
   lane's PR base.
3. Apply the phase-2 CI/default flip only under the coordinator's convergence ordering.
4. Coordinator owns canary C and its runtime verdict.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| D-17 chain | supervisor plan D-17 / drift D-60 | Ratified as written. |
| Phase-2 flip ordering | user dispatch | Wait for S1/S9/S11 on main. |
| D-155 parity union | coordinator ruling | Current-main is the base contract; S13 is additive. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | D-155 scoped check/lint/fmt, 13 focused parity tests, and repo check (`failedBatches: 0`). |
| Fitness | PASS | D-155 `quality:gate`, parity, manifest, and asset-barrel freshness. |
| MCP export corpus | PASS | Corpus hash `8f773fd4…`; 35 packages, 270 subpaths, 7,641 symbols. |
| Runtime | N/A | Explicit static-only dispatch. |
| Consumer | PASS | Generator/template tests, evaluator render, and emitted-sample gate. |
| IMPL-EVAL | Pending supervisor dispatch | Prior PASS is historical; separate GLM evaluates the corrected pushed head. |

## Drift and Debt

- Drift: S1 phase-1 files absent from the S10 sibling stack; phase 2 is implemented but unflipped.
- Drift: generated root runner now carries a direct MCP package dependency; canary C must publish
  MCP and CLI together. The synchronous example-route discovery trade-off and merge-head manifest
  regeneration obligation are recorded in `drift.md`.
- Debt: the Aspire-ps reader's diagnostic cause is a non-blocking future improvement.

## Commits

- The corrected range remains nine S13 commits. D-155 manifest/evidence is folded into the ninth
  narrow correction commit; final rewritten SHA is recorded in the push handoff.
