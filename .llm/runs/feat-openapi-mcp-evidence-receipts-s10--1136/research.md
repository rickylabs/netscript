# Research — F4a introspection-receipt evidence gate (#1136)

## Live authority

- Live issue #1136 (read 2026-08-04) requires exactly F4a: a post-S8 introspection receipt satisfies
  the #1078 drift-evidence gate, and the shipped public path cannot produce a pre-validation green
  receipt. F4b per-evidence-class keys are explicitly deferred.
- RFC #1123 `rfc.md` §2.7F and §9 ratify F4(a) now and F4(b) only after one field wave.
- `design/canonical/05-activation.md` §2F rev 2 identifies S8 receipt-after-validation as the hard
  prerequisite and the current one-receipt-per-resource store as intentionally insufficient for F4b.

## Current-main dependency proof (hard stop)

Baseline `origin/main` is `3677973bca448ada0b3982495cabed5261b1acb2`.

1. `packages/mcp/src/application/runner/mcp-server.ts` settles success only after the original
   result validates, truncation/bounding completes, and the bounded result validates again.
2. Flow throws, explicit failures, invalid output, and transport-limit failures settle a failed
   receipt before returning the protocol error.
3. Public-path focused tests on the fetched baseline passed: `drift-evidence_test.ts` plus
   `openapi-read-tools_test.ts` — **14 passed, 0 failed**. The suite includes invalid-output and
   throwing-flow stale-green replacement, plus successful S6 receipt settlement through S8.

The dependency is satisfied; implementation may proceed.

## Current F4a wiring

- `createMcpCliServer()` already wraps `list_api_services`, `list_service_operations`, and
  `get_operation_schema` with the shared receipt lifecycle.
- `recordDrift()` accepts any fresh receipt for the same resource with `exitStatus === 0`; it does
  not branch on the command. Therefore introspection receipts are already structurally compatible
  with #1078 and no evidence-store schema change is needed.
- Existing tests prove a successful introspection receipt is written, but do not drive that receipt
  through the public `record_drift` gate.
- Existing ordering tests inject internal flows. #1136 specifically requires the F4a negative
  through the public surface, so the new proof must call `createMcpCliServer()` with only public
  ports and JSON-RPC requests.
- The refusal guidance currently names doctor and telemetry only; it omits the newly accepted API
  introspection evidence class.

## Public-path negative proof design

A valid OpenAPI response schema can contain enough object properties to exceed the 64 KiB bounded
transport budget. Through `createMcpCliServer()` and a public `ServiceEndpointDirectoryPort`, call a
small introspection result first (green receipt), then request the large operation schema. The flow
succeeds before transport bounding, but the runner returns `tool_result_too_large` and must replace
the green receipt with `exitStatus: 1`. A subsequent public `record_drift` call must refuse. A
pre-validation receipt path would leave the prior/new green receipt and make that final call pass.

## JSR surface scan

| Check | Baseline result |
| --- | --- |
| Metadata/exports | `@netscript/mcp@0.0.4`; three existing entrypoints; no planned export change |
| `deno doc --filter recordDrift` | Public signature resolves with explicit `Promise<ToolExecutionResult>` |
| Full export-map doc lint | wrapper exit 0; combined summary reports 0 diagnostics |
| Package publish dry-run | success; no slow types; expected source/README/config file set |
| Planned risk | Test/guidance-only change must not alter exports, dependencies, publish list, or slow types |

## Doctrine and debt

- Owner-selected Archetype 2 applies to this `packages/mcp` evidence adapter/port slice.
- Historical doctrine census predates MCP. Open debt `MCP-A6-V2-SHAPE` concerns the broader CLI
  skeleton and is neither closed nor deepened here.
- In-scope anti-patterns: AP-1, AP-2, AP-3, AP-8, AP-9, AP-11, AP-13, AP-14, AP-16, AP-17,
  AP-19, AP-20, AP-22, AP-23, AP-24, AP-25. This slice adds no production abstraction, port,
  side effect, dependency, ignore, cast, or folder.

## Open questions

None. All implementation-shaping decisions are resolved in `plan.md`; F4b is a safe explicit
deferral because the issue and ratified RFC assign it to a later field wave.

