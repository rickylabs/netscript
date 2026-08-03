# Worklog: plan-openapi-mcp-plugin--seed

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `plan-openapi-mcp-plugin--seed` |
| Branch | `plan/openapi-mcp-plugin` |
| Archetype | 3 (target surface `packages/mcp`); ARCHETYPE-5 evaluated and rejected in-design |
| Scope overlays | none |

## Design

This is a seed design run — no implementation files. The design record replaces the usual
implementation-facing section as follows (per the generator brief's deliverable list):

### Public Surface (designed, not built)

- `packages/mcp`: 3 new read tools (`list_api_services`, `list_service_operations`,
  `get_operation_schema`), 1 deferred mutate tool (`invoke_service_operation`); ports
  `ServiceEndpointDirectoryPort`, `ServiceSpecPort`; package exports unchanged (`.`, `./cli`).
- `packages/cli`: helpers-template endpoint-manifest emission; composition-edge adapter wiring;
  scaffolded `AGENTS.md` line.
- Contracts: additive `.route({ summary, tags })` enrichment.

### Domain Vocabulary

- Operation identity = spec `operationId` = dotted contract path (verified oRPC default).
- Description ladder (4 rungs), schema views (`request`/`response`/`errors`/`all`),
  failure envelopes (`service_unknown` / `service_not_running` / `spec_unavailable` /
  `operation_unknown`), `EndpointPolicy` (off → safe-methods → per-operation allowlist).

### Constants

- Endpoint manifest: `.netscript/run/endpoints.json`, `schemaVersion: 1` (location = fork F1).
- Tool kind mapping: 3× `read`, 1× `mutate` (deferred).

### Commit Slices (this run)

| # | Slice | Content |
| - | --- | --- |
| 1 | seed design | supervisor, drift, research, plan, canonical 00–06, examples ×2, rfc, worklog, context-pack |

### Deferred Scope

- Execution tool implementation (owner fork F2); MCP-tools contribution axis (future seam,
  06 §1); #1093 fix (independent).

### Contributor Path

Implementing run: follow rfc.md §4 waves; Wave-0 proofs before any contract freezes.

## Progress Log

| Time (2026-08-03) | Step | Notes |
| --- | --- | --- |
| start | Bootstrap | Brief + harness skill read; #890 run record extracted from `plan/frontend-contrib` and shape-matched; supervisor.md + drift.md written |
| research | 3-way fan-out | GitHub corpus (PRs #890/#891/#822 + issues #1117/#1102/#1072/#1071/#1093); upstream prior-art code reading (6 projects, licenses verified); local mechanism exploration (mcp/service/sdk/cli/plugins) |
| research | In-session verification | ✔ `define-service.ts:227-228`; ✔ `service-url.ts:97-176`; ✔ `@orpc/openapi@1.14.13` operationId/summary emission (decisive for naming design) |
| design | research.md, plan.md | D1–D9 locked; forks F1–F5 |
| design | canonical 00–06 | overview · tool surface · discovery · projection/naming · execution/security · activation · doctrine-fit (AP/F by name, #1093 answer) |
| design | examples ×2 | wave-four silent-hang replay; discovery/degraded-modes/execution-opt-in walkthrough |
| design | rfc.md | #890/#891 shape; board placeholders NOT filed; no PR opened (brief stop-line) |

## Decisions

See `plan.md` § Locked Decisions (D1–D9) — not restated here.

## Drift

See `drift.md` (one entry: brief-mandated overrides — no PR, no runtime validation, shared
machine).

## Gate results

N/A — design-only run; no product code, no gates run. Runtime claims are cited from source, not
exercised (recorded in supervisor.md overrides).

## STAGE-COMPLETE: generator

Next: supervisor dispatches Codex GPT-5.6 Sol xhigh adversarial pass (findings only); this
session (or a successor generator session) integrates and records dispositions in
`adversarial-triage.md`, bumping the canonical docs and rfc.md to rev 2.
