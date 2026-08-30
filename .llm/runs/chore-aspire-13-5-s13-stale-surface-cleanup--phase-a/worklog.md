# Worklog: S13 stale surface cleanup

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-aspire-13-5-s13-stale-surface-cleanup--phase-a` |
| Branch | `chore/aspire-13-5-s13-stale-surface-cleanup` |
| Archetype | `6 — CLI / Tooling` with MCP Archetype 2 integration seam |
| Scope overlays | `docs` |

## Design

### Public Surface

- `resolveTelemetryEndpoint` remains the single endpoint policy function; no new package export map
  or root export is introduced.
- Scaffold outputs change only at the named telemetry example, Windows env, and consumer CI files.

### Domain Vocabulary

- `TelemetryEndpointSource` gains `aspire_ps`.
- `TelemetryEndpointPort` is the injected discovery seam; absence is a normal outcome.
- `AspirePsDashboardReader` is the infrastructure adapter around the Aspire CLI process boundary.

### Ports

- One synchronous dashboard-reader port is justified by the existing synchronous resolver and CLI
  composition. Tests replace it with deterministic S2/empty fixtures; domain code performs no IO.

### Constants

- `DEFAULT_TELEMETRY_ENDPOINT` remains the named compatibility value.
- Aspire CLI argv is finite and centralized in the infrastructure adapter.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | RED-first executable contracts | Focused tests fail for the intended missing behavior | tests + run dir |
| 2 | D-17 resolver and injected Aspire-ps adapter | MCP focused tests, scoped framework gates | `packages/mcp/**` |
| 3 | Owned cleanup and generated consumers | CLI focused tests + freshness gates | CLI templates/adapters/assets, skill mirror, teardown |
| 4 | Parity phase 2 | validation tests for phases 1/2 and report sweep | `.llm/tools/validation/**`, manifest tooling |
| 5 | Exact-head evidence and evaluator handoff | full listed static gate set | run dir only unless an evaluator fix is required |

### Deferred Scope

- CI phase-2 flip — deferred until S1/S9/S11 are all on main.
- Runtime E2E and canary C — coordinator-owned and explicitly prohibited in this dispatch.

### Contributor Path

Change endpoint precedence in `telemetry-endpoint.ts`, process interpretation in the Aspire-ps
infrastructure adapter, and consumer rendering in the focused scaffold sources; then run the named
source and generated-carrier freshness gates.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-30 | bootstrap | PLAN-EVAL disposition | Epic exhausted two evaluator cycles, then coordinator ratified D-1…D-17 and dispatched S13; leaf PLAN-EVAL is N/A under the authorized escalation path. |
| 2026-08-30 | bootstrap | host preflight | Deno 2.9.5, .NET 10.0.400, Aspire 13.5.3; `aspire ps` returned `[]`; `docker ps -a` returned no containers. |
| 2026-08-30 | 1 | RED-first contract | Structured test wrapper exited 1 before executing tests: missing Aspire-ps adapter, resolver lacks the third injected-port argument and `aspire_ps` source. This is the intended pre-implementation failure. |

## Gate Results

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| RED focused contracts | `run-deno-test.ts` over 7 focused test files | EXPECTED_FAIL (exit 1) | 9 type errors identify the missing adapter/port/source; stderr SHA-256 `c005517a…`. |

Runtime gates are N/A by explicit scope.

## Reconcile — slice 1

- Issue #1724 remains the sole closing issue; epic #1712 is reference-only. Draft PR will be opened
  after this commit at the required S10 base. No contract or scope readjustment was needed.

## Handoff Notes

- Evaluator must inspect only `a46ea16d..HEAD`, verify no runtime was started, and independently
  check whether the phase-2 CI flip remains deferred.
