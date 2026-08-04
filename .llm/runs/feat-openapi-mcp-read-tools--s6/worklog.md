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
| Implement | pending |
| Gate | pending |
| IMPL-EVAL | composed per milestone-run.md (orchestrator waiver) |

## Evidence

Pending implementation.
