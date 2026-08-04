# Context Pack: Aspire CLI adapter hardening

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-openapi-mcp-manifest-cli--1133` |
| Branch | `feat/openapi-mcp-manifest-cli` |
| Current phase | `gate` |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Current State

The identity-bound F1(b) adapter slice is implemented and its package/JSR gates pass. Baseline
verification still owns the AppHost slot; no expensive gate has started here.

## Completed

- Required skills/docs, issue, RFC §F1, P1 verdict, doctrine, gate matrix, and real Aspire output read.
- S6 checked: open with no PR, so directory fixture is current E2E fallback.
- Composed/not-local PLAN-EVAL ruling recorded.
- Adapter fixtures cover CLI absence, command failure, benign format drift, torn output, foreign
  project resources, and AppHost restart races.
- Package check/tests, scoped lint/fmt, quality/architecture, docs, and publish dry-run gates pass.

## In Progress

- Commit/push slice 2 and queue the serialized scaffold runtime proof.

## Next Steps

1. Re-check S6 and AppHost slot, then run serialized scaffold runtime evidence.
2. Push explicit refspec, maintain draft PR phase trail, and hand to composed evaluation.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| F1(b) only | P1/RFC/owner | No template manifest emission. |
| Exact path + stable AppHost PID | real Aspire `ps` | CLI adapter's observable run binding. |
| Foreign resource rejects source | doctrine/S-8 | Never partially trust foreign describe output. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/feat-openapi-mcp-manifest-cli--1133/*` | new | Harness bootstrap and locked design. |
| `packages/mcp/src/infrastructure/service-endpoints/aspire-cli-*.ts` | changed/new | identity-bound query, spawn boundary, output parser |
| `packages/mcp/src/ports/service-endpoint-directory-port.ts` | changed | finite `run_id_mismatch` failure code |
| `packages/mcp/tests/service-endpoint-*` | changed | negative and drift fixtures |
| `packages/mcp/README.md` + generated asset | changed | production behavior and permissions |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pass | check + scoped lint/fmt |
| Fitness | pass | focused/package tests, quality scan, arch check, JSR dry run |
| Runtime | queued | baseline owns AppHost slot |
| Consumer | queued | directory fixture unless S6 lands |

## Open Questions

- Will S6 land before the serialized runtime gate?

## Drift and Debt

- Drift: F1(b) rescope and composed PLAN-EVAL are recorded.
- Debt: none created.

## Commits

- See the draft PR's commit list + per-slice PR comments.
