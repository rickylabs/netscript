# beta6-nondash supervisor context pack

Status: TEL-T7 implementation complete on `feat/408-telemetry-t7-query` and rebased by merge onto
`origin/main` after T5 / #406 landed. Awaiting PR #567 review and IMPL-EVAL.

## Baseline

- Branch: `feat/408-telemetry-t7-query`
- Original T7 base confirmed at `c8f68721`; T3 commit present in history.
- Merge base updated on 2026-07-08 to include `origin/main` after T5 / #406.

## T5 / #406 now present from main

- Shared telemetry exports `SpanLinkPort`, meter/propagator provider public types, and
  `createFanInLinks`.
- Streams-core has publish and subscribe fan-in tracing.
- Sagas-core owns the shared OTEL saga tracer/facade and seven saga metric instruments.
- Plugin sagas consumes the shared core facade; the old plugin-local tracer path remains a
  compatibility re-export.

## T7 / #408 implemented on this branch

- `@netscript/telemetry/query` exports the query read-side contract and Aspire-backed adapter.
- Query read models cover traces, spans, logs, resources, metrics, span events, span links, and OTLP
  JSON export.
- Standard Schema validators cover trace/resource/metric query filters.
- `AspireTelemetryQuery` wraps Aspire dashboard `/api/telemetry/*` HTTP endpoints, supports
  resource/service filters, limits, `follow`, metric name filtering, API key header injection, and
  absent-Aspire empty-result degradation.
- Tests cover adapter grouping, logs/resources/metrics, validation failure, public default factory,
  graceful absent Aspire behavior, and layering.

## Validation snapshot

- T5 pre-merge evidence from main: check/fmt/lint wrappers green for 277 files; focused telemetry
  tests 13 passed; telemetry doc-lint and publish dry-run green.
- T7 pre-merge evidence: scoped telemetry check/lint/fmt green; focused query/layering tests 8
  passed; telemetry package tests 45 passed; full export doc-lint green; publish dry-run green; no
  new doctrine failures.
- Post-merge T7 evidence is recorded in `worklog-408.md` and the PR #567 merge-resolution comment.

## Constraints

- T5 span-link exports and T7 query exports must both remain present.
- No dashboard/UI/panel code is part of T7.
- No `deno.lock` changes should be kept unless Deno legitimately re-resolves the graph.
- No new `as` casts in this merge slice.

## Next

- Push PR #567 with an explicit refspec.
- Confirm GitHub reports PR #567 mergeability against `main`.
- Leave a PR comment with conflict resolution and green gate evidence.
