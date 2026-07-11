# Context Pack: host-agnostic agentic WSL execution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-602-agentic-host-agnostic--host-agnostic` |
| Branch | `fix/602-agentic-host-agnostic` |
| Current phase | `plan-eval` |
| Archetype | N/A — internal tooling |
| Scope overlays | none |

## Current State

Research, locked plan, and Design checkpoint were revised after the first PLAN-EVAL found two raw
execution sites missed by the initial regex audit. Implementation remains blocked on PLAN-EVAL PASS.

## Completed

- Required skills, harness workflow, lane policy, plan gate, and full agentic README read.
- Direct and shared `wsl.exe` call sites audited.
- First PLAN-EVAL `FAIL_PLAN` received; all four required plan fixes applied.

## In Progress

- Commit/bootstrap the draft PR and obtain PLAN-EVAL.

## Next Steps

1. Commit and push the revised plan artifacts with the explicit refspec.
2. Request the second opposite-family PLAN-EVAL cycle.
3. Implement only after PASS.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Pure command plan | plan D1 | Allows host/cwd/mismatch tests without spawn. |
| Fail local user mismatch | issue brief + plan D3 | Preserves `-u` semantics. |
| Shared plan for all output modes | PLAN-EVAL cycle 1 + plan D1/D5 | Includes buffered, captured, streaming, and stdin consumers. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | NOT_RUN | blocked on PLAN-EVAL |
| Fitness | N/A | internal tooling |
| Runtime | NOT_RUN | blocked on PLAN-EVAL |
| Consumer | NOT_RUN | blocked on PLAN-EVAL |

## Drift and Debt

- Drift: exact model suffix/effort unavailable; initial call-site regex missed streaming/stdin constructors and was corrected before implementation.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
