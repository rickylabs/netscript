# Worklog — OMB S6 three read tools

## Design

### Public surface

Three flow factories and their input/output types; three new tool contracts; one optional injected
`ServiceEndpointDirectoryPort` at the CLI composition edge.

### Domain vocabulary

`ApiServiceSummary`, `ListApiServicesResult`, `ServiceOperationSummary`,
`ListServiceOperationsResult`, and `GetOperationSchemaResult`. Existing `SourceOutcome`,
`ServiceEndpointRow`, `SchemaViewName`, and S4 projection types remain authoritative.

### Ports and composition

Consume the existing `ServiceEndpointDirectoryPort`. No new port. Default composition remains in
`cli.ts` through `createServiceEndpointDirectory`; fixtures inject a fake directory.

### Constants

`SERVICE_OPERATION_RESULT_LIMIT = 49` is the flow-owned row cap below the central 50-item cap.
Existing `SCHEMA_VIEW_NAMES`, endpoint statuses, and source identifiers are reused.

### Commit slices

1. Bootstrap plan artifacts.
2. Contracts + flows + acceptance fixtures.
3. Registry + composition + exports + documentation count synchronization.
4. Full gate/evaluation evidence and PR handoff.

### Deferred scope

No live AppHost/scaffold path, activation copy, execution tool, policy, or contract enrichment.

### Contributor path

Start at `tool-contracts.ts` for wire shape, follow the named flow in
`src/application/flows/`, then find composition and receipt wrapping in `cli.ts`.

## Phase status

| Phase | Status |
| --- | --- |
| Research | complete |
| Plan | complete |
| PLAN-EVAL | composed per milestone-run.md (orchestrator waiver) |
| Implement | complete |
| Gate | in progress |
| IMPL-EVAL | composed per milestone-run.md (orchestrator waiver) |

## Implementation evidence

- Added three contract entries and three one-flow-per-tool modules.
- `list_api_services` self-caps at 49, reports honest truncation, omits `operationCount` unless S5
  returned a running row with a parsed spec, and forwards the exact `sources` reference.
- `list_service_operations` composes S4 indexing/description, filters before a 49-row cap, and sets
  `truncated` exactly from dropped matching rows.
- `get_operation_schema` composes S4 canonical resolution/schema views and labels its curl output as
  an unauthenticated template.
- CLI composition injects or creates the S5 directory and wraps all three tools through S8's
  post-validation receipt lifecycle.
- Registry and documentation drift fixtures now record the truthful 14→17 live delta.

## Gate evidence

| Gate | Result |
| --- | --- |
| Acceptance/registry/stdio fixtures | PASS — 10/10 targeted tests |
| Full `packages/mcp` test | PASS — 98/98 |
| Scoped check wrapper | PASS — 92 files, 0 diagnostics |
| Scoped lint wrapper with package config | PASS — 92 files, 0 findings |
| Scoped fmt wrapper with package config | PASS — 92 files, 0 findings |
| `quality:gate` | PASS — quality scan `ok:true`; arch checks exit 0 (baseline warnings only) |
| Package doc-lint | PASS — combined total 0 |
| Package publish dry-run | PASS — no slow-type failure; S6 files in intended publish list |
| Lock hygiene | PASS after reversing Deno's unrelated queue lock resolution; final diff pending |

## Slice reconcile

- Issue 1132 remains open with three acceptance boxes; PR 1204 is draft with `status:plan` and
  milestone 0.0.5. Closing keyword is intentionally deferred until all evidence and checkboxes are
  truthful.
