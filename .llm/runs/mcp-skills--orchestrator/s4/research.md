# Research — S4 trace intelligence

Baseline: `dd89ced9` (corrected by the supervisor), with clean worktree and S3 telemetry substrate present.

## Current facts

- `packages/mcp` is an Archetype-6 CLI/tooling package with accepted debt `MCP-A6-V2-SHAPE`; S4 preserves its existing horizontal `domain/application/infrastructure` shape.
- `TelemetryQueryPort.querySpans()` is already injected through `createResolvedTelemetryQuery`; S4 needs no new adapter or dependency.
- `telemetry-aggregation.ts` already owns span duration/status, service lookup, execution identity, and semantic classification. S4 must extend this seam rather than duplicate it.
- `telemetry-summaries.ts` is the package-owned typed summary boundary. New result shapes belong there.
- S1 contracts require `jobId` for `get_last_job_result`; design requires optional `jobId` and/or `jobName`, including most-recent overall.
- Job/execution constants are available from `@netscript/telemetry/attributes`. KV constants are available from its KV module. Generic OTel database attributes are identified by the standard `db.` semantic-convention namespace.
- Sibling-sensitive files are `cli.ts` and `tool-contracts.ts`; edits can be minimal and additive.

## JSR surface scan

- No new export-map entry or dependency is needed; flows are composition-internal.
- Exported aggregation functions and domain summary types require explicit return types and one-line JSDoc to avoid slow-type/doc regressions.
- Full-export doc lint and package publish dry-run remain required. No lockfile mutation is expected.

## Re-baseline and open questions

The carried design was checked against the S3 implementation at `dd89ced9`; its named seams exist. No implementation-shaping question remains open after the locked decisions in `plan.md`.
