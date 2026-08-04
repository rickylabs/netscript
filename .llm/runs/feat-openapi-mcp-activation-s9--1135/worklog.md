# Worklog: OMB S9 activation surfaces and migration fixture

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-openapi-mcp-activation-s9--1135` |
| Branch | `feat/openapi-mcp-activation-s9` |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Design

### Public Surface

- MCP `initialize.result.instructions` gains one curl-moment sentence.
- Existing `get_recent_errors` and `doctor` result contracts gain bounded operation-schema hints.
- Scaffolded `apps/<app>/AGENTS.md` gains one behavioral line.
- No TypeScript export map or CLI command changes.

### Domain Vocabulary

- `operationSchemaHint` — stable pointer telling an agent to call `get_operation_schema` for a
  service before constructing a request.
- prior-release host file — exact-version `.mcp.json` input that intentionally remains old until
  `agent init` rewrites it.

### Ports

- None added. Existing telemetry query, doctor family, filesystem, and MCP server seams are enough.

### Constants

- One operation-schema hint formatter/constant only if the contract needs consistent bytes.
- `OPENAPI_TOOL_TRIAD` in the migration fixture: `list_api_services`,
  `list_service_operations`, `get_operation_schema`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Activation bytes across initialize, app conventions, and failure outputs | focused MCP + scaffold tests | MCP runner/contracts/flows/tests; CLI app convention/tests; run artifacts |
| 2 | S-18 prior-release exact-pin migration | focused agent-init test | agent-init fixture/test; run artifacts |

### Deferred Scope

- Introspection receipt gating and field-use measurement remain in RFC fork F4 / #1090 lineage.
- Existing-project app-scoped file backfill is not claimed; root guidance is updated by re-init.

### Contributor Path

Start at `mcp-server.ts` for session instructions, the two MCP flows plus `tool-contracts.ts` for
failure hints, `agent-conventions.ts` for new app scaffolds, and `init-agent_test.ts` for host-file
migration behavior.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-04 | bootstrap | research + plan | Current 21-tool surface re-baselined; milestone waiver composed and plan locked. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Plan-Gate row composed, no local formal PLAN-EVAL | owner-specified milestone-run ruling D6 | user prompt / `milestone-run.md` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Issue lineage says 14 tools; current registry is 21 | minor | yes |

## Gate Results

Pending implementation.

## Handoff Notes

- Evaluator should inspect the three byte fixtures and the S-18 causal chain first.

