# Context Pack: generated SQLite/libsql service `--allow-ffi`

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-scaffold-sqlite-allow-ffi--1191` |
| Branch | `fix/scaffold-sqlite-allow-ffi` |
| Current phase | `IMPL-EVAL PASS; ready-merge close-gate handoff` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `service` |

## Current State

Issue #1191 is re-baselined on current main. The permission defect is localized to generated service
argv. The plan is locked under the explicit milestone composed-evaluation waiver. A real SQLite
scaffold, after DB init/generate/seed, reproduced the target RED: `users` Finished with exit 1,
Unhealthy populated health report, and libsql `NotCapable` explicitly requesting `--allow-ffi`.
The generator and semantic test are fixed, and the same scaffold is GREEN: Running/Healthy with a
populated report, real HTTP 200, live DB OpenAPI, and OTEL request evidence. P2 DB measurement and
the epic S4/S6 impact comment are complete.

## Completed

- Issue/evidence read; requested and repository-mandated skills applied.
- Clean main baseline confirmed.
- Command-emission seam and SQLite selection seam identified.
- Plan-Gate recorded as `composed per milestone-run.md (orchestrator waiver)`.
- Target runtime RED recorded in `proofs/red-runtime.json`.
- Generated-output RED/GREEN and five-engine audit complete.
- Target runtime GREEN recorded in `proofs/green-runtime.json`.
- `P2-db.json` appended; epic #1126 impact comment posted.

## In Progress

- Close-gate evidence mirror and orchestrator pre-merge handoff.

## Next Steps

1. Apply `status:ready-merge` after local evidence-mirror preflight.
2. Require a current green close-gate and named CI results.
3. Hand merge authority to the milestone orchestrator; do not merge from this supervisor session.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Augment service argv at generated runtime | plan D1 | Primary database engine is available in generated config. |
| Other engines remain unchanged | plan D3 | Semantic permission audit is required. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-scaffold-sqlite-allow-ffi--1191/` | new | Harness bootstrap and locked plan. |
| `packages/cli/src/kernel/templates/aspire/helpers/` | modified | SQLite-aware service argv plus generated-output coverage. |
| `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/evidence/P2-db.json` | new | Fixed DB scaffold P2 measurement. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | helper suite 18 tests / 164 steps; scoped check/lint/fmt zero findings |
| Fitness | PASS | `quality:gate`; CLI doc-lint; CLI publish dry-run |
| Runtime | RED + GREEN PASS | `proofs/red-runtime.json`; `proofs/green-runtime.json` |
| Consumer | PASS | focused 32-step generated-output suite; `P2-db.json` |
| Hygiene | PASS | exact stop; leak report has no slice-owned survivors |
| Independent evaluation | PASS | `evaluate.md`; OpenHands run `30860595979` |

## Open Questions

- The P2 experiment hardcodes no-DB classifier fields in DB output; measurement payload remains
  valid and the S4/S6 impact was recorded for orchestrator disposition.

## Drift and Debt

- Drift: authorized composed PLAN-EVAL waiver; stale P2 classifier metadata.
- Debt: none created; existing CLI Restructure verdict not deepened.

## Commits

- `d398b48a4` — locked research/plan and draft PR surface.
- `c795d6f8f` — implementation, generated-output coverage, live RED/GREEN evidence, P2 evidence,
  and final gates.
- `01bb577ff` — independent OpenHands IMPL-EVAL PASS (`evaluate.md` only).
