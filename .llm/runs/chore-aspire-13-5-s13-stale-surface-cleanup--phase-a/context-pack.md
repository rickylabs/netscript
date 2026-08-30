# Context Pack: S13 stale surface cleanup

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-aspire-13-5-s13-stale-surface-cleanup--phase-a` |
| Branch | `chore/aspire-13-5-s13-stale-surface-cleanup` |
| Current phase | `IMPL-EVAL complete` |
| Archetype | `6 — CLI / Tooling` plus MCP Archetype 2 seam |
| Scope overlays | `docs` |

## Current State

Phase A is complete at evaluated implementation head `fc0a0c8c`. Fresh independent native
Claude/Fable 5 medium cycle 2 returned `PASS`. The PR remains draft on the S10′ stack. S1, S9, and
S11 are not all on `main`, so phase 1 remains the default and the CI phase-2 flip is deferred.

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

## In Progress

- Final artifact-only commit, explicit push, and PR comment/body synchronization.

## Next Steps

1. Coordinator retargets the draft PR per D-58 as the stack lands.
2. Coordinator regenerates the tree-bound manifest at the merge head and performs the close gate.
3. Apply the phase-2 CI/default flip only after S1 #1727, S9 #1759, and S11 #1771 are on `main`.
4. Coordinator owns canary C and its runtime verdict.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| D-17 chain | supervisor plan D-17 / drift D-60 | Ratified as written. |
| Phase-2 flip ordering | user dispatch | Wait for S1/S9/S11 on main. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | Scoped check/lint/fmt and focused tests; exact-head receipts in `receipts/`. |
| Fitness | PASS | `quality:scan`, `arch:check`, asset/publish freshness, Claude mirror, emitted samples. |
| Runtime | N/A | Explicit static-only dispatch. |
| Consumer | PASS | Generator/template tests, evaluator render, and emitted-sample gate. |
| IMPL-EVAL | PASS | Cycle 2, native Claude/Fable 5 medium, exact head `fc0a0c8c`. |

## Drift and Debt

- Drift: S1 phase-1 files absent from the S10 sibling stack; phase 2 is implemented but unflipped.
- Drift: generated root runner now carries a direct MCP package dependency; canary C must publish
  MCP and CLI together. The synchronous example-route discovery trade-off and merge-head manifest
  regeneration obligation are recorded in `drift.md`.
- Debt: the Aspire-ps reader's diagnostic cause is a non-blocking future improvement.

## Commits

- Seven implementation commits through `fc0a0c8c`; see draft PR #1779 and one per-slice comment for
  each. The final harness-evidence commit follows without changing the evaluated product head.
