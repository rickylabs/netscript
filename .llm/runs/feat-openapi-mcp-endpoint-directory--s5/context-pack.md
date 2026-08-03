# Context Pack: OMB S5 ServiceEndpointDirectoryPort + adapters

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-openapi-mcp-endpoint-directory--s5` |
| Branch | `feat/openapi-mcp-endpoint-directory` |
| Current phase | `implement` (plan locked via composed waiver) |
| Archetype | `2 — Integration` slice |
| Scope overlays | none |

## Current State

Research and design are locked at clean `origin/main` `2c8865e8c`. P1 selects qualified F1(b), so
the current precedence is override > aspire-cli > run-manifest > appsettings. P3 exact failure
guidance is binding. No implementation exists yet.

## Completed

- Read issue #1131, RFC #1123, epic context, P1/P3 verdicts, canonical discovery design, required
  harness/doctrine/Aspire/JSR/PR/tooling authorities, and package consumers.
- Confirmed baseline doc lint and publish dry-run clean, no lock churn.
- Recorded Design checkpoint and the milestone-run PLAN-EVAL composed waiver.

## In Progress

- Launch the attached Codex implementation lane for slices 1–3 from the run-owned staging
  worktree. The provided PR worktree remains owned by this Desktop supervisor session.

## Next Steps

1. Launch the canonical complex implementation route through `.llm/tools/agentic/` in the
   run-owned staging worktree.
2. Review each landed slice, fast-forward the provided PR worktree, run gates, and reconcile
   GitHub state.
3. Trigger composed final evaluation surfaces and prepare close-gate evidence.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| `override > aspire-cli > run-manifest > appsettings` | P1 + RFC | CLI is primary live; explicit override remains supreme. |
| Manifest requires expected current run id | plan D4 | Missing/mismatch is visible failure. |
| No S4 imports | user coordinate rule | S6 composes later. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/feat-openapi-mcp-endpoint-directory--s5/` | new | Harness bootstrap/plan/design/waiver/brief |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | baseline PASS; implementation pending | current package doc lint/dry-run only |
| Fitness | pending | full A2 column planned |
| Runtime | pending | fixture matrix and bounded timeout case |
| Consumer | pending | public exports/docs planned |

## Open Questions

- None blocking implementation.

## Drift and Debt

- Drift: composed evaluator waiver; true remote baseline; manifest run-id injection clarification.
- Debt: preserve existing `MCP-A6-V2-SHAPE`; no new debt planned.

## Commits

- See the draft PR's commit list + per-slice PR comments.
