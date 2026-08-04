# Plan: accept introspection receipts at the evidence gate (#1136)

## Run metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-openapi-mcp-evidence-receipts-s10--1136` |
| Branch | `feat/openapi-mcp-evidence-receipts-s10` |
| Phase | `plan` (locked; same-run implementation under milestone waiver) |
| Target | `packages/mcp` shared diagnostic evidence machinery |
| Archetype | `2 - Integration` (owner binding for `packages/mcp`) |
| Scope overlays | none |

## Goal

Make F4a mechanically explicit: a successful introspection receipt produced by the shipped S8 path
authorizes `record_drift`, while an introspection result rejected during transport validation cannot
leave usable green evidence.

## Current doctrine verdict

The doctrine census predates `@netscript/mcp`. Open debt `MCP-A6-V2-SHAPE` records a broader
horizontal/Archetype-6 shape exception. The owner binds this slice to Archetype 2. This narrow gate
change neither closes nor deepens that debt.

## Locked decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Preserve `DiagnosticEvidenceReceipt` and the one-receipt-per-resource store unchanged. | F4a accepts another command class; F4b alone needs evidence-kind/operation keys. |
| D2 | Prove acceptance by calling `list_api_services` and then `record_drift` through `createMcpCliServer()`. | Exercises the shipped composition and public JSON-RPC surface rather than directly writing a receipt. |
| D3 | Prove the negative with a valid oversized OpenAPI operation schema through public `ServiceEndpointDirectoryPort` injection. | The flow reaches runner bounding; a pre-validation green receipt would survive, while S8 must settle failure. |
| D4 | Assert the failed receipt and a subsequent public `record_drift` refusal after a prior public green receipt. | Demonstrates both ordering and absence of stale-green authorization. |
| D5 | Update refusal guidance to name API introspection tools alongside doctor and telemetry. | F4a is incomplete if the gate accepts evidence that its recovery text hides. |
| D6 | Add no command allowlist, evidence-kind enum, receipt schema, filesystem layout, or per-operation key. | Those are F4b machinery explicitly out of scope. |
| D7 | Preserve all public exports and package metadata. | This is an acceptance-gate slice, not a surface expansion. |

## Open-decision sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Which introspection tool proves acceptance | resolved now | `list_api_services` writes resource `project` and has a minimal deterministic result. |
| Which path proves post-validation ordering | resolved now | `get_operation_schema` with a valid oversized schema reaches the central byte-limit rejection. |
| Per-evidence-class receipt keys | safe to defer | Explicit F4b scope; no F4a rework depends on choosing its later schema. |
| Endpoint-shape-only drift classification | safe to defer | Requires an evidence-kind model and is not represented by current `RecordDriftInput`. |

No unresolved decision would force rework in this slice.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Test accidentally writes evidence directly | Only inspect the injected public port; all writes originate from JSON-RPC tool calls. |
| Negative mocks an internal flow | Inject only the public service-directory port into `createMcpCliServer`; do not import receipt lifecycle internals. |
| Oversized fixture is invalid OpenAPI | Use a normal 3.1 response schema with many ordinary object properties. |
| Negative proves only an RPC error, not the gate | Assert failed replacement receipt and a following `record_drift` refusal. |
| F4b leaks into scope | No production types/storage keys/predicates are added. |
| Existing tests rely on old refusal text | Retain doctor and telemetry wording; add introspection wording and focused assertion. |
| Package gates absorb unrelated lock churn | Stage explicit owned paths only; compare the pre-existing one-line `deno.lock` diff before commits. |

## Gate set

| Gate | Required evidence |
| --- | --- |
| S8 dependency | Baseline code ordering + focused 14-test run on fetched `origin/main` |
| F4a behavior | Focused public-path acceptance and negative tests |
| Static/F-19 | Scoped check, lint, and fmt wrappers over `packages/mcp` |
| Archetype-2 F-1..F-19 | `quality:gate` (`quality:scan` + `arch:check`) plus substantive diff review |
| Runtime/consumer | Real `createMcpCliServer` JSON-RPC calls through public ports |
| JSR F-5/F-6/F-7 | Full export-map doc lint, package audit helper, package publish dry-run |
| Regression | Full `packages/mcp` test task |
| Hygiene | No new lint ignore/cast, no `deno.lock` inclusion, only owned files committed |

## Commit slices

| Slice | Proves | Gate | Files |
| --- | --- | --- | --- |
| S0 | Research, design, waiver, and PR review surface are locked before implementation. | Composed plan-gate row | Run-dir artifacts only |
| S1 | Public introspection receipts satisfy F4a and rejected outputs cannot authorize drift. | Focused tests + Archetype-2/JSR gates | `packages/mcp/src/application/flows/record-drift-flow.ts`, `packages/mcp/tests/drift-evidence_test.ts`, run artifacts |

## Deferred scope

- F4b per-evidence-class keys `(resource, evidenceKind, operation)`.
- Requiring introspection specifically for endpoint-shape claims.
- Receipt-store migrations, new public contracts, and observational adoption measurement.
- Broader package restructuring or closure of `MCP-A6-V2-SHAPE`.
- Any dependency, version, generated asset, or `deno.lock` change.

## Debt implications

No new debt is expected. `MCP-A6-V2-SHAPE` remains open and unchanged. Any new doctrine failure is
fixed or escalated; no new allowance is planned.

