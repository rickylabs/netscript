# TEL-T7 / Issue #408 Worklog

## Implementation Notes

- Replaced the previous `@netscript/telemetry/query` scaffold with a real read-side contract.
- Added domain read models for traces, spans, logs, resources, metrics, span events, span links, and
  portable OTLP JSON export.
- Added `TelemetryQueryPort` under `src/ports/telemetry-query-port.ts`.
- Added Standard Schema query-filter validators under `src/application/query/schema.ts`.
- Added `AspireTelemetryQuery` under `src/adapters/aspire-query/`, wrapping Aspire dashboard
  `/api/telemetry/*` HTTP endpoints with injected `fetch`, optional API key, and graceful empty
  results on absent Aspire.
- Added `packages/telemetry/query.ts` as the public `./query` subpath edge; it exports the contract
  plus the Aspire adapter and default `createTelemetryQuery()` factory.
- Updated the README and telemetry package `deno.json` export map/task entries.
- Added query adapter tests and extended the telemetry layering test for `adapters/aspire-query`.

## Scope Fence

- No dashboard-panel-facing code was added.
- No UI integration or dashboard data-layer switching was implemented.
- `deno task e2e:cli` was accidentally started by a malformed PR-comment shell command after the
  slice commit, then interrupted immediately with Ctrl-C; no E2E verdict was produced or used as
  evidence. See `drift.md`.
- No new `as` casts were introduced in the T7 files.
- `deno.lock` churn occurred during Deno resolution and was reverted before commit.

## Gate Evidence

| Gate | Command | Result |
| --- | --- | --- |
| Wrapper check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/telemetry --ext ts,tsx --pretty` | exit 0; filesSelected=91; failedBatches=0; totalOccurrences=0 |
| Wrapper lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/telemetry --ext ts,tsx --pretty` | exit 0; filesSelected=91; totalOccurrences=0 |
| Wrapper fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/telemetry --ext ts,tsx --ignore-line-endings --pretty` | exit 0; filesSelected=91; failedBatches=0; findings=0 |
| Focused query/layering tests | `deno test --allow-env --allow-read packages/telemetry/tests/query/aspire_query_test.ts packages/telemetry/tests/layering_test.ts` | exit 0; 8 passed / 0 failed |
| Telemetry package tests | `deno task test` from `packages/telemetry` | exit 0; 45 passed / 0 failed |
| Full export doc-lint wrapper | `deno task doc:lint --root packages/telemetry --pretty` | exit 0; summary totalErrors=0; `./query.ts` total=0 |
| Raw full export doc-lint | `deno doc --lint ./attributes.ts ./config.ts ./context.ts ./instrumentation.ts ./mod.ts ./orpc.ts ./query.ts ./registry.ts ./src/adapters/otel/mod.ts ./src/testing/mod.ts ./tracer.ts` from `packages/telemetry` | exit 0; `Checked 11 files` |
| Publish dry-run | `deno publish --dry-run --allow-dirty` from `packages/telemetry` | exit 0; no `--allow-slow-types`; dry run complete |
| Doctrine fitness | `deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/telemetry --pretty` | exit 0; FAIL=0; WARN=6 pre-existing telemetry package warnings; no new adapter size warning after split |

## Command Interruption

- While posting the PR implementation comment, shell backticks in the comment body were interpreted
  by Bash. The malformed command printed errors and started `deno task e2e:cli`; it was interrupted
  immediately with Ctrl-C and exited 130. This run is not counted as gate evidence and did not
  replace the scoped telemetry validation above.

## Reconcile

- Issue #408 should be closed by the T7 PR after Tier-A review, IMPL-EVAL, and merge close-gate
  verification.
- Epic #399 remains referenced only as the parent telemetry-revamp epic.
- T8 (#409) owns the Flow-B full scaffold runtime E2E; this slice intentionally did not run it.
