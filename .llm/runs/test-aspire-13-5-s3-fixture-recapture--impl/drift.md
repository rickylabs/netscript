# Drift Log: Aspire 13.5 S3 fixture re-capture

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-30 — Dashboard telemetry requires phase B

- **What:** S2 receipts contain `aspire ps`, `aspire describe`, doctor, and runtime/MCP projections,
  but no dashboard `/api/telemetry/resources` or `/api/telemetry/spans` envelopes.
- **Source:** S2 receipt inventory and issue #1715 dispatch correction.
- **Expected:** Original issue text implied S2 V5 contained dashboard envelopes.
- **Actual:** Capturing them requires a running 13.5.3 AppHost and runtime lease.
- **Severity:** minor
- **Action:** defer to phase B in the same draft PR; keep telemetry parity `pending-lease` in phase A.
- **Evidence:** `origin/test/aspire-13-5-s2-runtime-verification` receipt inventory and
  `packages/mcp/tests/fixtures/telemetry/aspire-13.4.6-fixture.ts` capture header.
