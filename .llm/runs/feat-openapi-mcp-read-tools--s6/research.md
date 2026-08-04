# Research — OMB S6 three read tools

## Authority and baseline

- Read issue 1132 and RFC PR 1123 before implementation.
- Rebased the feature branch onto remote `origin/main` at `f7558aa1c` on 2026-08-04.
- S4 is present as the pure `@netscript/mcp/openapi-projection` export, including operation index,
  canonical identity resolution, description ladder, and schema views.
- S5 is present as `ServiceEndpointDirectoryPort` plus the composed precedence
  `override > aspire-cli > run-manifest > appsettings`; directory results retain opaque parsed specs
  only for running rows and return the complete `sources` array.
- S8 is present as runner-settled `withFlowReceipt`: settlement occurs after output validation.

## Re-baselined facts

1. The live `TOOL_NAMES` count is **14**, not the staged brief's expected 17. The issue itself says
   registry 14→17. Adding the three accepted tools therefore makes the live delta **14→17**, not
   17→20. No placeholder tools will be invented to satisfy the stale count.
2. `list_api_services` can compute `operationCount` only for a running row because only that row
   contains `spec`. All other states must omit the property entirely.
3. `list_service_operations` and `get_operation_schema` can reuse the exact retained spec and S4
   projection; neither needs a new fetch port or a second OpenAPI parser.
4. S5's `sources` value is already the desired discriminated source-outcome block and can be
   forwarded unchanged by identity, preserving every property and order.
5. S8's receipt lifecycle is attached at the CLI composition edge, so all three flows should use
   the existing `withReceipt` wrapper rather than write evidence themselves.

## JSR surface scan

- Package metadata, three entrypoints, module docs, and explicit exported symbol types already
  exist. New public flow factories/types need JSDoc and explicit return types.
- New exports must be added through `mod.ts`; no self-referential package imports.
- Required publish gates: full package doc-lint and package-local publish dry-run; slow types or
  private type references are blockers.
- No dependency change is required and no lock churn is expected.

## Doctrine and debt

- Selected Archetype 2 because flows compose a package-owned external directory port and existing
  network/source adapters; no service/runtime overlay applies because all acceptance is fixture-only.
- Current doctrine verdict has no explicit `packages/mcp` row; new code is held to the current
  Archetype-2 rules without deepening recorded debt.
- In-scope risks: AP-1 oversized files, AP-7 duplicate upstream/projection behavior, AP-9 helper
  flags, AP-11 module-load side effects, AP-22 empty barrels, AP-23 inline composition bodies,
  AP-25 side effects outside adapters/edges.

## Open questions

None that force rework. Output field names and failure envelopes follow issue/RFC wording and
existing tool schema conventions.
