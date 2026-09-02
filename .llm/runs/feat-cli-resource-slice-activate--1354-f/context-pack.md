# Context Pack: Slice F activation (#1354)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-cli-resource-slice-activate--1354-f` |
| Branch | `feat/cli-resource-slice-activate` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | frontend consumer output; runtime/hosted excluded |

## Current State

The integration branch contains #1664 head `9295eabaa`, Slice A, and Slice E at `be3e3dded`. The owner amended Slice F after the mandated stop found `agent-conventions.ts` as an additional rendered consumer; item 33 and ceiling 33 now govern the run. Implementation and supervisor review are complete pending the clean-tree generated-corpus/assets checks and formal IMPL-EVAL.

## Completed

- Complete 18-template retire-set plus manual route seed removed.
- Init and command share the planner, neutral assets, and generated-source formatter.
- Fresh derives manifest/routes after route emission; exact init-preset command rerun is conflict-free and byte-identical.
- `generate resource` is registered fourth through production-composed dependencies.
- Focused 32/32 and full CLI 1324/1324 test suites pass; structured check/lint/fmt and precommit fitness gates pass.

## In Progress

- First implementation commit, clean-tree carrier verification, and formal IMPL-EVAL.

## Next Steps

1. Commit and push the reviewed implementation.
2. Run clean-tree corpus/assets checks and any final affected gates.
3. Run the opposite-family IMPL-EVAL, update artifacts/PR, commit and push final evidence.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| One planner/template authority | locked D4/F | Init preset is exactly form+partial. |
| Fresh derivation after routes | locked D5/F | Manual seeds are retired. |
| Partial issue reference | MEDIUM-3 / owner | `Refs #1354`; Slice G remains. |

## Files Changed

- 33 product paths: 32 tracked paths plus the new focused writer test; the generated MCP corpus is unchanged.

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pass | CLI check 0 diagnostics; touched lint/fmt 0 findings. |
| Fitness | pass | JSR audit, publish dry-run, `arch:check`, and `quality:gate` exit 0. |
| Runtime | N/A | Slice G owns hosted acceptance. |
| Consumer | pass precommit | focused 32/32; full CLI 1324/1324; publish assets/emitted samples/docs gates pass. |

## Open Questions

- Formal IMPL-EVAL remains.

## Drift and Debt

- Drift: RTK absence, stacked-base movement, and the item-33 rescope are recorded.
- Debt: Slice E LOW-2 remains deferred because its required `generate-resource-command.ts` edit is outside Slice F's amended file set.

## Commits

- See the PR commit list and per-phase comments.
