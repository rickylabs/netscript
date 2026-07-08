# #406 T5 worklog — Span links for streams and sagas

## Implementation

Branch: `feat/406-telemetry-t5-span-links`

Implemented:

- `@netscript/telemetry` application helper `createFanInLinks(messages, spanLinks)`.
- SDK/Deno link behavior tests proving SDK keeps attributes and Deno-native reports dropped
  attributes through `SpanLinkPort`.
- `@netscript/plugin-streams-core` real stream telemetry facade:
  - PRODUCER `stream.publish` span.
  - W3C `traceparent` injection into published stream event headers.
  - CONSUMER `stream.subscribe` span with fan-in links attached at span creation.
- `@netscript/plugin-sagas-core` shared saga OTEL facade:
  - plugin-local tracer reduced to a compatibility re-export.
  - saga span links use `createFanInLinks`.
  - saga attributes use `netscript.*` / upstream semconv keys.
  - seven saga meter instruments created from the shared telemetry `MeterPort`.
- Plugin saga runner now imports shared saga telemetry from `@netscript/plugin-sagas-core/telemetry`.

## Acceptance Evidence

- streams emits PRODUCER/CONSUMER spans with real links:
  `packages/plugin-streams-core/tests/telemetry/instrumentation_test.ts`.
- sagas carry real SDK link attributes:
  `packages/plugin-sagas-core/tests/telemetry/otel-saga-telemetry_test.ts`.
- SDK adapter preserves attributes and Deno adapter reports dropped attributes:
  `packages/telemetry/tests/application/fan-in-links_test.ts`.
- Link attributes use semconv keys plus `netscript.*`:
  `StreamAttributes`, `SagaAttributes`, and the tests above.
- TC-14 link construction goes through shared `createFanInLinks`; callers do not re-hand-roll link
  construction.

## Gate Evidence

| Gate | Exit | filesSelected | failedBatches | totalOccurrences |
| --- | ---: | ---: | ---: | ---: |
| check wrapper | 0 | 277 | 0 | 0 |
| fmt wrapper | 0 | 277 | 0 | 0 |
| lint wrapper | 0 | 277 | 0 | 0 |

Additional gates:

- `deno test --unstable-kv --allow-all ...telemetry test set...` exit 0; 13 passed.
- `deno doc --lint packages/telemetry/mod.ts` exit 0.
- `deno publish --dry-run --allow-dirty` in `packages/telemetry` exit 0; no `--allow-slow-types`.

## Lock Hygiene

`deno.lock` changed during validation because Deno refreshed workspace dependency metadata. It was
reverted before commit.
