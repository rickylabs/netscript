# Context Pack: fix #808 MCP live-validation blockers

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-808-mcp-live-defects--mcp-live` |
| Branch | `fix/808-mcp-live-defects` |
| Current phase | `plan` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

Branch is rebased and clean at the current `origin/main@7bc256a1` baseline. Issue #808, the full external live report,
doctrine, prior MCP run context, public surface, owning adapters, schemas, and CLI composition have
been re-baselined. Plan/design are locked; the owner explicitly waived evaluator dispatch.

## Completed

- Required skills and authorities read.
- GitHub issue fetched through the repository token resolver/API.
- Root causes and implementation decisions recorded.
- Pre-change JSR/doc surface scan and package dry-run completed.

## In Progress

- Harness bootstrap commit/draft PR, then no-cleanup live scaffold capture.

## Next Steps

1. Commit/push the harness bootstrap and open the draft PR.
2. Run the no-cleanup scaffold, restart AppHost if required, trigger a job, and capture Dashboard
   response provenance.
3. Implement and commit each defect separately with its focused gates and PR comment.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Fix parser in telemetry owner; test at MCP boundary | plan D1 | No duplicated adapter. |
| Aggregate doctor family output | plan D2 | Keep max 20. |
| Embedded package README default | plan D3/D4 | Explicit missing override errors. |
| No formal eval dispatch | owner directive | No verdict will be claimed. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-808-mcp-live-defects--mcp-live/*` | new | Harness bootstrap only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pre-change scanned | doc-lint wrapper + raw corroboration + package dry-run |
| Fitness | pending | quality/architecture after implementation |
| Runtime | pending | no-cleanup capture and 13-tool matrix |
| Consumer | pending | final cleanup scaffold runtime |

## Open Questions

- None blocking implementation after the owner waiver.

## Drift and Debt

- Drift: evaluator dispatch waived; existing `./cli` private-type refs discovered.
- Debt: `MCP-A6-V2-SHAPE` remains accepted and unchanged.

## Commits

- See the draft PR's commit list + per-slice PR comments.
