# Context Pack: generated SQLite/libsql service `--allow-ffi`

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-scaffold-sqlite-allow-ffi--1191` |
| Branch | `fix/scaffold-sqlite-allow-ffi` |
| Current phase | `plan-eval` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `service` |

## Current State

Issue #1191 is re-baselined on current main. The permission defect is localized to generated service
argv. The plan is locked under the explicit milestone composed-evaluation waiver; implementation has
not begun. No AppHost is running.

## Completed

- Issue/evidence read; requested and repository-mandated skills applied.
- Clean main baseline confirmed.
- Command-emission seam and SQLite selection seam identified.
- Plan-Gate recorded as `composed per milestone-run.md (orchestrator waiver)`.

## In Progress

- Slice 1 commit/push/draft-PR opening.

## Next Steps

1. Capture real-scaffold RED without overlapping another AppHost.
2. Add failing generated-output test, implement SQLite-only FFI, run focused gates.
3. Capture GREEN, P2 evidence, epic impact comment, final gates, and leak check.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Augment service argv at generated runtime | plan D1 | Primary database engine is available in generated config. |
| Other engines remain unchanged | plan D3 | Semantic permission audit is required. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-scaffold-sqlite-allow-ffi--1191/` | new | Harness bootstrap and locked plan. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | NOT_RUN | planned after source slice |
| Fitness | PLAN LOCKED | plan-gate waiver record |
| Runtime | SLOT FREE | `aspire ps --format Json` = `[]` |
| Consumer | NOT_RUN | RED first pending |

## Open Questions

- None blocking.

## Drift and Debt

- Drift: authorized composed PLAN-EVAL waiver only.
- Debt: none created; existing CLI Restructure verdict not deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.

