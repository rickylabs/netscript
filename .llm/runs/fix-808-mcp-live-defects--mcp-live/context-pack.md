# Context Pack: fix #808 MCP live-validation blockers

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-808-mcp-live-defects--mcp-live` |
| Branch | `fix/808-mcp-live-defects` |
| Current phase | `implementation follow-up` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

The original three #808 defects are live-verified. Round-two validation found one follow-up blocker:
the project doctor assumed a monolithic `.netscript/generated/plugins.ts`, while the generator emits
per-plugin registry modules beneath `.netscript/generated`. The owner again explicitly prohibited
self-evaluation and merge.

## Completed

- Required skills and authorities read.
- GitHub issue fetched through the repository token resolver/API.
- Root causes and implementation decisions recorded.
- Pre-change JSR/doc surface scan and package dry-run completed.
- Original implementation, 13-tool live validation, and final cleanup-on scaffold runtime completed.
- Round-two doctor root cause confirmed against the validator's real generated scaffold layout.

## In Progress

- Fixing the doctor at its infrastructure filesystem seam and regression-guarding the captured layout.

## Next Steps

1. Run focused doctor tests and the real-flow schema regression.
2. Commit and push the follow-up through the existing branch.
3. Post implementation evidence to draft PR #809; do not dispatch evals or merge.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Fix parser in telemetry owner; test at MCP boundary | plan D1 | No duplicated adapter. |
| Aggregate doctor family output | plan D2 | Keep max 20. |
| Embedded package README default | plan D3/D4 | Explicit missing override errors. |
| No formal eval dispatch | owner directive | No verdict will be claimed. |
| Discover generated registry modules recursively | generator emission contract | Accept generic `*.registry.ts`, official `*-registry.ts`, and legacy `plugins.ts`. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `packages/mcp/src/infrastructure/project-wiring-doctor-family.ts` | modified | Diagnose the generator's emitted layouts rather than one hardcoded file. |
| `packages/mcp/tests/fixtures/doctor/healthy/.netscript/generated/*` | modified | Round-two canonical scaffold path capture. |
| `packages/mcp/tests/doctor-families_test.ts` | modified | Assert all three captured modules are recognized. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | passed | Prior final package gates; follow-up focused checks pending. |
| Fitness | passed | Prior `quality:scan` and `arch:check`. |
| Runtime | round-two input | Original fixes live-verified; doctor follow-up awaiting external live rerun. |
| Consumer | passed | Prior cleanup scaffold runtime: 60 passed, 0 failed. |

## Open Questions

- None blocking implementation after the owner waiver.

## Drift and Debt

- Drift: round-two live validation exposed a generator/doctor layout mismatch; evaluator dispatch waived.
- Debt: `MCP-A6-V2-SHAPE` remains accepted and unchanged.

## Commits

- See the draft PR's commit list + per-slice PR comments.
