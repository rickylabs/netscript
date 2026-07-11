# Worklog — #495 Fresh MCP sandbox stub

## Preflight

- Baseline: `955b4abf639522c7da50bd15d20c6e999acb808f` (required prefix `955b4abf`).
- Branch: `fix/495-fresh-sandbox-stub`.
- Issue #495 acceptance contract read on 2026-07-11.
- PLAN-EVAL: owner-waived as carried drift D1 in the slice brief.

## Design

- **Public surface:** keep the implemented `createMcpSandboxHandler` and its option type on
  `@netscript/fresh/ai/sandbox`; remove `createNetScriptMcpSandbox` and its three placeholder types.
- **Domain vocabulary:** no new vocabulary. The removed `sources` contract could not supply either
  upstream dependency's required inputs.
- **Ports:** none added. `mergeAgentTools` consumes server/client tool arrays; `createMcpAppBridge`
  consumes thread, endpoint, and chat options. Inventing adapters between these unrelated inputs is
  deferred to the real FA composition slice.
- **Constants:** none required.
- **Commit slice:** unpublish the by-design throwing skeleton and add an export-map regression test;
  prove with focused tests, scoped static wrappers, doc lint, and publish dry-run.
- **Deferred scope:** designing the future FA composition contract; this requires product-level API
  decisions absent from #495.
- **Contributor path:** add a fully designed composition beside `mcp-sandbox-handler.ts`, test it,
  then export it from `sandbox.ts` only after its runtime contract is real.

## Locked decision

Use the issue's **unpublish fallback**. Implementation is not a small wrapper: the current public
options and return type represent neither `mergeAgentTools` nor `createMcpAppBridge`. Removing only
the skeleton leaves the useful subpath live and avoids publishing an invented contract.

## Risks and mitigations

- Consumers compiling against the beta stub will see a missing export; this is preferable to an
  API that always throws, and is the issue-authorized fallback.
- Accidental re-export is guarded by a unit test importing the actual subpath module.

## Published skeleton scan

Focused scan of `packages/fresh` found no other published throwing `FA0` / `not implemented`
exports. Remaining `FA0` text in the AI README/module documentation is roadmap prose, not a throw.

## Validation

| Gate | Result |
| --- | --- |
| Focused sandbox tests | PASS — 8 passed, 0 failed |
| Scoped check wrapper (`packages/fresh`, `ts,tsx`) | PASS (exit 0) |
| Scoped lint wrapper (`packages/fresh`, `ts,tsx`) | PASS (exit 0) |
| Scoped format-check wrapper (`packages/fresh`, `ts,tsx`) | PASS (exit 0) |
| Full Fresh export-map doc lint wrapper | PASS (exit 0) |
| Root `deno task publish:dry-run` | PASS (exit 0) |

## Reconcile

- Issue #495 remains open; this implementation fully satisfies its acceptance contract.
- No PR was opened, per the slice brief. No new issue comments required plan readjustment.
- D2 records the only plan choice: the authorized unpublish fallback.
