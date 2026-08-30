# Context Pack: Aspire `/public` reference accuracy

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-aspire-public-surface--1782` |
| Branch | `docs/aspire-public-surface` |
| Current phase | `implement` |
| Archetype | N/A — docs-only correction describing Archetype 2 |
| Scope overlays | `SCOPE-docs.md` |

## Current State

Source confirms four domain/port symbols are published only through `@netscript/aspire/public`; the
reference page now describes the aggregate accurately and inventories all four.

## Completed

- Read issue #1782 and umbrella #1777 including comments.
- Re-derived the export map, public barrel, definitions, reachability, and generator chain.
- Recorded `PLAN-EVAL: N/A` before implementation.
- Implemented the proportionate page correction.

## In Progress

- Commit S1, regenerate four derived assets, run gates, and open/update the final non-draft PR.

## Next Steps

1. Commit and push S1, then create the non-draft PR against `main`.
2. Build the site and regenerate the four derived assets with S1 provenance.
3. Run all requested gates and publish exact exit codes/evidence in the PR.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Four symbols are `/public`-only | Source/export-map audit | Internal domain/ports barrels are not published entrypoints. |
| Two commits only | Slice brief | S1 owns prose/run artifacts; S2 owns exactly four derived assets. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `docs/site/reference/aspire/index.md` | changed | Corrected paragraph and added four exclusive symbols. |
| `.llm/runs/docs-aspire-public-surface--1782/` | new | Harness state and launch identity. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static/docs | pending final head | PR Validation table after S2 |
| Generated assets | pending S2 | Four-file derived diff and provenance check |
| Runtime | N/A | Docs-only; no behavior or diagrams changed |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: none created or deepened.

## Commits

- See the PR commit list and per-slice comments; this run uses the mandated two-commit shape.
