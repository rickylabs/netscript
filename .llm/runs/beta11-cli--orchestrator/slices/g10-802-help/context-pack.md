# Context Pack: issue #802 plugin CLI help

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `beta11-cli--orchestrator/slices/g10-802-help` |
| Branch | `fix/802-plugin-cli-help` |
| Current phase | `plan-eval` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

Research and the mini plan are complete. Option (b) is locked because current sibling executable
guidance consistently uses direct `deno x`, while the shared help layer has no one-time hint seam.
No implementation source has been edited; the Plan-Gate hard stop is active.

## Completed

- Read required harness/CLI/PR/tools/doctrine/JSR instructions and live issue #802.
- Audited workers, sagas, triggers, and streams source/test surfaces.
- Created the nested run artifacts and recorded the single required decision.

## In Progress

- Separate-session PLAN-EVAL by the Fable 5 supervisor.

## Next Steps

1. Supervisor writes `plan-eval.md` with `PASS` or `FAIL_PLAN`.
2. On PASS, implement the one source/test slice and run all named gates.
3. Commit, push with the explicit refspec, open/update the draft PR, label/milestone it, and comment gate evidence.
4. Hand back for opposite-family review/IMPL-EVAL; do not merge or publish.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Option (b), direct version-pinned `deno x` usage | `plan.md`; sibling source audit | Truthful without install state or a new shared hint contract. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | NOT_RUN | Plan-Gate hard stop |
| Fitness | NOT_RUN | Plan-Gate hard stop |
| Runtime | N/A planned | Metadata-only behavior |
| Consumer | Focused metadata tests planned | Three touched CLIs |

## Drift and Debt

- Drift: none.
- Debt: no new/deepened entry expected.

## Commits

- See the draft PR's commit list + per-slice PR comments.

