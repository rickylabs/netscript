# Context Pack: Aspire CLI adapter hardening

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-openapi-mcp-manifest-cli--1133` |
| Branch | `feat/openapi-mcp-manifest-cli` |
| Current phase | `implementation evaluation` |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Current State

The identity-bound F1(b) adapter and scaffold named gate are implemented. A real proxy collision
proved the identity guard and added allocated target-PORT selection. Package/static gates pass;
pre-reconcile branch CI passed the named live adapter gate and the canonical suite 71/71 with
cleanup. S6 then landed on main, so the rebased gate now invokes `list_api_services` and awaits a
current-head repeat.

## Completed

- Required skills/docs, issue, RFC §F1, P1 verdict, doctrine, gate matrix, and real Aspire output read.
- S6 checked: open with no PR, so directory fixture is current E2E fallback.
- Composed/not-local PLAN-EVAL ruling recorded.
- Adapter fixtures cover CLI absence, command failure, benign format drift, torn output, foreign
  project resources, and AppHost restart races.
- Package check/tests, scoped lint/fmt, quality/architecture, docs, and publish dry-run gates pass.
- Canonical S7 negative case rejected a foreign service on the fixed proxy port.

## In Progress

- Current-head scaffold runtime after upgrading the live gate to S6's `list_api_services` flow.
- Composed implementation review/sign-off under milestone ruling D6.

## Next Steps

1. Repeat serialized scaffold runtime on the S6-rebased head.
2. Obtain separate composed implementation review/sign-off.
3. Move to `status:ready-merge` only after the evaluator comment and complete DoD.

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
| `packages/cli/e2e/**` | changed/new | named live directory gate wired into scaffold.runtime |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pass | check + scoped lint/fmt |
| Fitness | pass | focused/package tests, quality scan, arch check, JSR dry run |
| Runtime | pending current head | [pre-reconcile CI attempt 2](https://github.com/rickylabs/netscript/actions/runs/30895255613/job/91950747988): canonical suite 71/71 with cleanup |
| Consumer | pending current head | directory fallback passed live; rebased gate now invokes S6 `list_api_services` flow |

## Open Questions

- Which composed reviewer surface will supply the separate IMPL-EVAL verdict after the automatic OpenHands job was policy-skipped?

## Drift and Debt

- Drift: F1(b) rescope and composed PLAN-EVAL are recorded.
- Debt: none created.

## Commits

- See the draft PR's commit list + per-slice PR comments.
