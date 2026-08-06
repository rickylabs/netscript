# Research — #1117

## Live issue and baseline

Read #1117 first. Its required local-only introspection surface is substantially present on the
canary train through epic #1126 slices S4/S5/S6/S7/S9/S10:

- `list_api_services` resolves dynamic Aspire endpoints through the identity-bound endpoint
  directory.
- `list_service_operations` indexes the selected live OpenAPI document.
- `get_operation_schema` resolves one canonical operation and projects request/response/error views.
- The stdio server, registry, receipts, docs, generated `.mcp.json`, and app-scoped convention are
  already shipped and tested.

The owner also live-exercised the first two tools tonight. The implementation must extend this
surface, not create another projector, server, discovery adapter, or hosted dependency.

## Remaining defect

The app-scoped `AGENTS.md` convention currently says to call `list_service_operations` and
`get_operation_schema` before curl. That is not a complete reachable path:

1. `list_service_operations` requires a non-empty `service` input.
2. The omitted `list_api_services` tool is the public path that discovers valid live service names
   and Aspire-assigned URLs.
3. The runtime E2E gate calls only `createListApiServicesFlow`; it does not prove an agent following
   the convention can continue through operation enumeration and schema retrieval.

This can leave a following agent guessing the service name or returning to shell probes even though
all three tools exist. It is the precise activation class measured in #1197: installed capability
without an end-to-end route.

## Doctrine / scope

- Archetype 6 owns the scaffold convention and runtime consumer gate.
- A1/A2: the user-visible ordered funnel is the contract; no new hidden abstraction.
- A6/A7: reuse the three existing flows and Web/Deno primitives; add no helper or dependency.
- A14: the runtime gate must fail when a step silently disappears, not merely assert tool strings.
- No public exports or MCP schemas move; jsr-audit/publish dry-run are required only if research
  proves that boundary changes after plan lock.

