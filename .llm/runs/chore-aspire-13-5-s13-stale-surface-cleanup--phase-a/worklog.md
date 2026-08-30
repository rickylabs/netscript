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

- `resolveTelemetryEndpoint` remains the single endpoint policy function and is exported from the
  existing package root so generated consumers can reuse the policy rather than copy it.
- Scaffold outputs change only at the named telemetry example, Windows env, and consumer CI files.

### Domain Vocabulary

- `TelemetryEndpointSource` gains `aspire_ps`.
- `AspirePsDashboardPort` is the injected discovery seam; absence is a normal outcome.
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
| 2026-08-30 | 2 | D-17 implementation | Added the injected dashboard port and runtime-edge `AspirePsDashboardReader`; wired query, doctor, MCP server, and CLI composition through the one resolver. |
| 2026-08-30 | 3 | stale-surface cleanup | Reused the shared reader from generated telemetry and `.netscript/aspire-cli.ts`; removed bare dashboard defaults, stale wording/pin, paired consumer CI with `SCAFFOLD_VERSIONS`, and updated teardown MCP ownership. |
| 2026-08-30 | 3 | generated carriers | Regenerated CLI/publish assets, synchronized Claude skill mirrors, and regenerated the 798-row Aspire surface manifest with zero unmatched paths. |

## Gate Results

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| RED focused contracts | `run-deno-test.ts` over 7 focused test files | EXPECTED_FAIL (exit 1) | 9 type errors identify the missing adapter/port/source; stderr SHA-256 `c005517a…`. |
| MCP tests | `run-deno-test.ts -- --allow-all packages/mcp/tests` | PASS | 139 passed, 0 failed. |
| MCP check | `run-deno-check.ts --root packages/mcp --ext ts,tsx` | PASS | 117 files; no findings. |
| MCP lint/fmt | structured lint/fmt wrappers for `packages/mcp` | PASS | 116 files; no findings. |
| Framework quality | `deno task quality:scan` | PASS | No findings; existing allowance count 7. |
| Architecture | `deno task arch:check` | PASS | No failures; existing repository warnings retained. |
| CLI/teardown focused tests | structured test wrapper over 8 files | PASS | 96 passed, 0 failed. |
| CLI touched-root check | `run-deno-check.ts` over touched CLI roots | PASS | 83 files; no findings. |
| Raw lint/fmt | `deno lint --no-config` and `deno fmt --no-config` with repository style flags | PASS | 19 config-excluded touched TypeScript files; one pre-existing regex spacing form corrected without an ignore. |
| Claude mirror | `deno task agentic:sync-claude:check` | PASS | 18 skills, 22 mirrored files. |
| Emitted samples | `deno task check:emitted-samples` | PASS | 47 emitted TypeScript samples from 37 artifact paths. |
| Framework quality (slice 3) | `deno task quality:scan` | PASS | No findings; existing allowance count 7. |
| Architecture (slice 3) | `deno task arch:check` | PASS | No failures; existing repository warnings retained. |

Runtime gates are N/A by explicit scope.

## Reconcile — slice 1

- Issue #1724 remains the sole closing issue; epic #1712 is reference-only. Draft PR will be opened
  after this commit at the required S10 base. No contract or scope readjustment was needed.

## Reconcile — slice 2

- D-17 remains unchanged: explicit option → NetScript env → Aspire dashboard port → injected
  `aspire ps` adapter → named default. The adapter selects a running AppHost by canonical path and
  treats the authoritative empty array as unavailable. Domain code performs no process or file IO.

## Reconcile — slice 3

- Generated telemetry now delegates to the package resolver and renders the required unavailable
  guidance instead of materializing the compatibility default. The generated workspace Aspire task
  also consumes the shared reader, completing the D-17 extraction.
- S7's `aspire agent mcp` ownership update was not present on this S10 sibling stack, so S13 applied
  it once here with the RED-first test already committed in slice 1.
- Asset freshness commands compare against committed state; their exact-head checks are scheduled
  immediately after this slice commit and again in the final gate receipt pass.

## Handoff Notes

- Evaluator must inspect only `a46ea16d..HEAD`, verify no runtime was started, and independently
  check whether the phase-2 CI flip remains deferred.
