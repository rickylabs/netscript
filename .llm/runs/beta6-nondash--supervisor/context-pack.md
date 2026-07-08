# beta6-nondash context pack

## Current Slice

T5 / #406 (`feat/406-telemetry-t5-span-links`) implements span-link fan-in for streams and sagas.

## Current State

- Shared telemetry now exports `SpanLinkPort`, meter/propagator provider public types, and
  `createFanInLinks`.
- Streams-core has real tracing on publish and subscribe fan-in.
- Sagas-core owns the shared OTEL saga tracer/facade and seven saga metric instruments.
- Plugin sagas consumes the shared core facade; the old plugin-local tracer path is a re-export for
  compatibility.
- `deno.lock` must remain unmodified; any validation churn should be reverted.

## Validation Snapshot

- check wrapper: exit 0, `filesSelected=277`, `failedBatches=0`, `totalOccurrences=0`.
- fmt wrapper: exit 0, `filesSelected=277`, `failedBatches=0`, `findings=0`.
- lint wrapper: exit 0, `filesSelected=277`, `totalOccurrences=0`.
- focused telemetry tests: exit 0, 13 passed.
- telemetry `deno doc --lint`: exit 0.
- telemetry `deno publish --dry-run --allow-dirty`: exit 0, no `--allow-slow-types`.

## Next

Open a draft PR for #406 with `Closes #406`, acceptance/gate checkboxes checked with the evidence
above, labels/milestone applied, and a slice implementation comment containing commit hash and gates.
