# Worklog: Aspire CLI adapter production hardening

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-openapi-mcp-manifest-cli--1133` |
| Branch | `feat/openapi-mcp-manifest-cli` |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Design

### Public Surface

- Existing `AspireCliEndpointSource` and `AspireCliEndpointSourceOptions`; no new entrypoint.
- Existing `SourceOutcome` exposes every failure as data.

### Domain Vocabulary

- `appHostPath` — exact real path selecting one AppHost.
- `appHostPid` — CLI-visible run identity, stable across one describe snapshot.
- `projectRoot` — real-path ownership boundary for AppHost and resource working directories.

### Ports

- `EndpointSourcePort` — unchanged consumed contract.
- `AspireCliCommand` — existing injected spawn boundary, reused for `ps` and `describe`.

### Constants

- Existing `SOURCE_FAILURE_CODES`; extend only for a finite, machine-readable CLI identity failure.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Harness bootstrap and locked design | artifact review | run dir |
| 2 | Identity-bound drift-tolerant CLI adapter + fixtures | focused MCP tests + static/fitness gates | adapter, port, tests, docs, run dir |
| 3 | Serialized scaffold runtime proof and handoff | `scaffold.runtime` plus separate composed evaluation | E2E evidence, run dir, PR surface |

### Deferred Scope

- `list_api_services` tool wiring remains S6 unless it merges before the runtime gate.
- Manifest emission is rejected by qualified F1(b).

### Contributor Path

Add a future Aspire output variant by extending the adapter's named field readers and adding one
fixture that proves both accepted drift and rejection of an adjacent torn/ambiguous shape.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-04 | 1 | bootstrap | Read brief, five named skills, tooling/JSR guidance, #1133, RFC §F1, P1 verdict, doctrine, matrix, and real CLI output. |
| 2026-08-04 | 1 | serialization | `aspire ps` showed baseline-owned AppHosts; runtime gate queued. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Qualified F1(b), no template emission | P1 locked verdict | #1123 §F1 / P1 verdict / owner brief |
| CLI run binding is exact AppHost path + stable PID | Facts exposed by real Aspire 13.4.6 `ps` | research D1-D3 |
| PLAN-EVAL is composed/not-local | Milestone evaluator rule | owner brief / milestone-run D6 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Issue title/body still describe manifest emission; authoritative F1(b) re-scopes to CLI hardening. | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| plan gate | composed milestone ruling | PASS | `plan-eval.md` is explicitly not a local formal eval. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Archetype-2 | NOT_RUN | queued | implementation not started |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| AppHost serialization | PASS | `aspire ps --format Json` | Baseline owns slot; this run did not start resources. |
| `scaffold.runtime` | NOT_RUN | queued | wait for baseline slot release |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| scaffolded app | NOT_RUN | queued | S6 currently not landed; directory fixture fallback selected. |

## Handoff Notes

- Evaluator should inspect identity rejection fixtures and the post-describe run-stability check first.

