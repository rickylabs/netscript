# beta6-nondash supervisor worklog

## Design

Public surface:

- T5 / #406 keeps shared span-link fan-in exports on `@netscript/telemetry`: `SpanLinkPort`,
  provider public types, and `createFanInLinks`.
- T7 / #408 adds `@netscript/telemetry/query` exported from `packages/telemetry/query.ts`.
- T7 query contract exports: `TelemetryQueryPort`, `TelemetryQueryOptions`,
  trace/span/log/resource/metric read-model types, and `TelemetryOtlpJson`.
- T7 Standard Schema validators: `traceQueryFilterSchema`, `resourceQueryFilterSchema`,
  `metricQueryFilterSchema`, plus `validate*QueryFilter` helpers.
- T7 adapter exports: `AspireTelemetryQuery`, `createAspireTelemetryQuery`, and
  `createTelemetryQuery`.

Domain vocabulary:

- T5 span links describe fan-in relationships across stream and saga execution.
- T7 query-side read models are separate from write-side span contracts:
  `TelemetryTrace`, `TelemetrySpan`, `TelemetryLog`, `TelemetryResource`, `TelemetryMetric`,
  `TelemetrySpanEvent`, and `TelemetrySpanLink`.
- Attribute values preserve TC-1..14 vocabulary by carrying canonical attribute names verbatim,
  including `netscript.*` and upstream semconv keys.

Ports:

- T5 exposes span-link construction through the shared telemetry application layer.
- T7 `TelemetryQueryPort` is the single read-side seam under
  `src/ports/telemetry-query-port.ts`.
- `AspireTelemetryQuery` implements the T7 port against Aspire dashboard `/api/telemetry/*`
  endpoints.

Constants:

- No new finite telemetry convention constants in T7. Existing TC-1..14 and attribute vocabulary
  remain authoritative.

Commit slices:

- T5: span-link fan-in exports and plugin stream/saga wiring, landed on `main` before this merge.
- T7: query contract, Aspire query adapter, `./query` export, tests, and harness evidence.
- Merge slice: additive conflict resolution after T5 landed; preserve both T5 span-link and T7 query
  surfaces.

Deferred scope:

- Dashboard panels, UI integration, and dashboard data-layer switching are out of scope for T7.
- Full `scaffold.runtime` E2E is out of scope per T8 (#409).

Contributor path:

- Add a new query backend by implementing `TelemetryQueryPort` under `src/adapters/<backend>/`,
  re-exporting it from `packages/telemetry/query.ts`, and adding adapter tests under
  `tests/query/`.

## T5 / #406 — SpanLinkPort fan-in links

Date: 2026-07-08

T5 landed on `main` before this merge.

### Scope

- Promoted provider-aware fan-in span-link construction into `@netscript/telemetry` application
  layer via `createFanInLinks(messages, spanLinks)`.
- Wired streams-core producer spans with W3C trace-header injection and consumer subscribe spans
  with SDK-preserved fan-in link attributes.
- Moved saga OTEL tracer/facade implementation into `@netscript/plugin-sagas-core/telemetry`,
  leaving the plugin-local tracer file as a thin compatibility re-export.
- Updated saga telemetry attributes and metric names to the `netscript.*` convention and added the
  seven shared saga metric instruments.
- Added tests for SDK link attributes, Deno-native dropped-link attributes, streams
  producer/consumer spans, saga fan-in links, and shared saga meters.

### Gate Evidence

| Gate | Command | Exit | Evidence |
| --- | --- | ---: | --- |
| check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/telemetry --root packages/plugin-streams-core --root packages/plugin-sagas-core --root plugins/sagas --ext ts,tsx` | 0 | `filesSelected=277`, `failedBatches=0`, `totalOccurrences=0` |
| fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/telemetry --root packages/plugin-streams-core --root packages/plugin-sagas-core --root plugins/sagas --ext ts,tsx` | 0 | `filesSelected=277`, `failedBatches=0`, `findings=0` |
| lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/telemetry --root packages/plugin-streams-core --root packages/plugin-sagas-core --root plugins/sagas --ext ts,tsx` | 0 | `filesSelected=277`, `totalOccurrences=0` |
| focused tests | `deno test --unstable-kv --allow-all packages/telemetry/tests/application/fan-in-links_test.ts packages/plugin-streams-core/tests/telemetry/instrumentation_test.ts packages/plugin-sagas-core/tests/telemetry/otel-saga-telemetry_test.ts plugins/sagas/tests/telemetry/otel-saga-tracer_test.ts plugins/sagas/tests/telemetry/publish-trace-linkage_test.ts packages/plugin-sagas-core/tests/telemetry/instrumentation_test.ts packages/plugin-sagas-core/tests/telemetry/saga-engine-spans_test.ts` | 0 | 13 passed, 0 failed |
| telemetry doc lint | `deno doc --lint packages/telemetry/mod.ts` | 0 | Checked 1 file |
| telemetry publish dry-run | `deno publish --dry-run --allow-dirty` from `packages/telemetry` | 0 | Success; no `--allow-slow-types` |

### Reconcile

- `deno.lock` churn appeared during T5 validation after package import-map additions and publish
  dry-run. It was reverted per #406 constraints.
- No plan or doctrine divergence recorded for T5.

## T7 / #408 — Query Contract and Aspire Adapter

See `worklog-408.md` for per-slice implementation notes and original gate results.

## Merge Resolution — PR #567 after T5 landed

Date: 2026-07-08

- Merged `origin/main` into `feat/408-telemetry-t7-query`.
- Conflict markers appeared only in shared harness artifacts:
  `context-pack.md`, `drift.md`, and `worklog.md`.
- Resolution was additive: retained T5 span-link/fan-in run evidence from `main` and T7 query
  contract/Aspire adapter evidence from this branch.
- Source files merged without conflict; no tests were skipped or disabled.
