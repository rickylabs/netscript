# beta6-nondash supervisor worklog

## Design

Public surface:

- `@netscript/telemetry/query` exported from `packages/telemetry/query.ts`.
- Query contract exports: `TelemetryQueryPort`, `TelemetryQueryOptions`,
  trace/span/log/resource/metric read-model types, and `TelemetryOtlpJson`.
- Standard Schema validators: `traceQueryFilterSchema`, `resourceQueryFilterSchema`,
  `metricQueryFilterSchema`, plus `validate*QueryFilter` helpers.
- Adapter exports: `AspireTelemetryQuery`, `createAspireTelemetryQuery`, and
  `createTelemetryQuery`.

Domain vocabulary:

- Query-side read models are separate from write-side span contracts:
  `TelemetryTrace`, `TelemetrySpan`, `TelemetryLog`, `TelemetryResource`,
  `TelemetryMetric`, `TelemetrySpanEvent`, and `TelemetrySpanLink`.
- Attribute values preserve TC-1..14 vocabulary by carrying canonical attribute names verbatim,
  including `netscript.*` and upstream semconv keys.

Ports:

- `TelemetryQueryPort` is the single read-side seam under `src/ports/telemetry-query-port.ts`.
- `AspireTelemetryQuery` implements the port against Aspire dashboard `/api/telemetry/*`
  endpoints.

Constants:

- No new finite telemetry convention constants. Existing TC-1..14 and attribute vocabulary remain
  authoritative.

Commit slices:

- T7: query contract, Aspire query adapter, `./query` export, tests, and harness evidence.

Deferred scope:

- Dashboard panels, UI integration, and dashboard data-layer switching are out of scope for this
  slice.
- Full `scaffold.runtime` E2E is out of scope per T8 (#409).

Contributor path:

- Add a new query backend by implementing `TelemetryQueryPort` under `src/adapters/<backend>/`,
  re-exporting it from `packages/telemetry/query.ts`, and adding adapter tests under
  `tests/query/`.

## T7 Evidence

See `worklog-408.md` for per-slice implementation notes and gate results.
