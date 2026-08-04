# Context Pack: Aspire CLI adapter hardening

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-openapi-mcp-manifest-cli--1133` |
| Branch | `feat/openapi-mcp-manifest-cli` |
| Current phase | `implement` |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Current State

Branch is fast-forwarded to main after S5. Research and design are locked for the F1(b) adapter
hardening. Baseline verification owns the AppHost slot; no expensive gate has started here.

## Completed

- Required skills/docs, issue, RFC §F1, P1 verdict, doctrine, gate matrix, and real Aspire output read.
- S6 checked: open with no PR, so directory fixture is current E2E fallback.
- Composed/not-local PLAN-EVAL ruling recorded.

## In Progress

- Implement pre/post `aspire ps` identity binding, project-root validation, drift-tolerant parsing,
  explicit failures, and fixtures.

## Next Steps

1. Implement adapter and focused tests.
2. Run Archetype-2/package/JSR gates and review the slice.
3. Re-check S6 and AppHost slot, then run serialized scaffold runtime evidence.
4. Push explicit refspec, maintain draft PR phase trail, and hand to composed evaluation.

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

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pending | implementation not started |
| Fitness | pending | implementation not started |
| Runtime | queued | baseline owns AppHost slot |
| Consumer | queued | directory fixture unless S6 lands |

## Open Questions

- Will S6 land before the serialized runtime gate?

## Drift and Debt

- Drift: F1(b) rescope and composed PLAN-EVAL are recorded.
- Debt: none created.

## Commits

- See the draft PR's commit list + per-slice PR comments.
