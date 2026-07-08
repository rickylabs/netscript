# beta6-nondash supervisor worklog

## Design

Public surface:

- T5 / #406 keeps shared span-link fan-in exports on `@netscript/telemetry`: `SpanLinkPort`,
  provider public types, and `createFanInLinks`.
- T6 / #407 keeps `@netscript/telemetry/orpc` as the oRPC telemetry subpath while replacing the
  bespoke tracing plugin internals with upstream `@orpc/otel` instrumentation.
- T7 / #408 adds `@netscript/telemetry/query` exported from `packages/telemetry/query.ts`.

Domain vocabulary:

- T5 span links describe fan-in relationships across stream and saga execution.
- T6 oRPC telemetry uses upstream oRPC SERVER/CLIENT instrumentation spans and NetScript-owned
  `netscript.*` attributes on the active span.
- T7 query-side read models are separate from write-side span contracts:
  `TelemetryTrace`, `TelemetrySpan`, `TelemetryLog`, `TelemetryResource`, `TelemetryMetric`,
  `TelemetrySpanEvent`, and `TelemetrySpanLink`.

Ports:

- T5 exposes span-link construction through the shared telemetry application layer.
- T6 wires first-party oRPC instrumentation behind the existing telemetry tracer/provider seam.
- T7 `TelemetryQueryPort` is the single read-side seam under
  `src/ports/telemetry-query-port.ts`.

Constants:

- Existing TC-1..14 and `netscript.*` attribute vocabulary remain authoritative.
- T6 must not introduce a second copy of upstream oRPC span lifecycle policy.

Commit slices:

- T5: span-link fan-in exports and plugin stream/saga wiring, landed on `main`.
- T6: rework bespoke oRPC tracing to `@orpc/otel`, preserve SDK/AI/worker acceptance, and record
  gate evidence for PR #568.
- T7: query contract, Aspire query adapter, `./query` export, tests, and harness evidence, landed
  on `main`.

Deferred scope:

- Dashboard panels, UI integration, and dashboard data-layer switching are out of scope.
- Full `scaffold.runtime` E2E is out of scope per T8 (#409) unless explicitly requested.

Contributor path:

- Add new telemetry adapters behind `src/adapters/<backend>/` or existing provider seams.
- Add new query backends by implementing `TelemetryQueryPort` under `src/adapters/<backend>/`,
  re-exporting from `packages/telemetry/query.ts`, and adding adapter tests under `tests/query/`.

## T5 / #406 - SpanLinkPort fan-in links

Date: 2026-07-08

T5 landed on `main` before this rework.

### Scope

- Promoted provider-aware fan-in span-link construction into `@netscript/telemetry` application
  layer via `createFanInLinks(messages, spanLinks)`.
- Wired streams-core producer spans with W3C trace-header injection and consumer subscribe spans
  with SDK-preserved fan-in link attributes.
- Moved saga OTEL tracer/facade implementation into `@netscript/plugin-sagas-core/telemetry`,
  leaving the plugin-local tracer file as a thin compatibility re-export.

### Gate Evidence

| Gate | Command | Exit | Evidence |
| --- | --- | ---: | --- |
| check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/telemetry --root packages/plugin-streams-core --root packages/plugin-sagas-core --root plugins/sagas --ext ts,tsx` | 0 | `filesSelected=277`, `failedBatches=0`, `totalOccurrences=0` |
| fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/telemetry --root packages/plugin-streams-core --root packages/plugin-sagas-core --root plugins/sagas --ext ts,tsx` | 0 | `filesSelected=277`, `failedBatches=0`, `findings=0` |
| lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/telemetry --root packages/plugin-streams-core --root packages/plugin-sagas-core --root plugins/sagas --ext ts,tsx` | 0 | `filesSelected=277`, `totalOccurrences=0` |
| focused tests | `deno test --unstable-kv --allow-all packages/telemetry/tests/application/fan-in-links_test.ts packages/plugin-streams-core/tests/telemetry/instrumentation_test.ts packages/plugin-sagas-core/tests/telemetry/otel-saga-telemetry_test.ts plugins/sagas/tests/telemetry/otel-saga-tracer_test.ts plugins/sagas/tests/telemetry/publish-trace-linkage_test.ts packages/plugin-sagas-core/tests/telemetry/instrumentation_test.ts packages/plugin-sagas-core/tests/telemetry/saga-engine-spans_test.ts` | 0 | 13 passed, 0 failed |
| telemetry doc lint | `deno doc --lint packages/telemetry/mod.ts` | 0 | Checked 1 file |
| telemetry publish dry-run | `deno publish --dry-run --allow-dirty` from `packages/telemetry` | 0 | Success; no `--allow-slow-types` |

## T6 / #407 - oRPC telemetry rework

Date: 2026-07-08

- Owner-directed rework is implemented for PR #568.
- Original slice artifact: `.llm/runs/beta6-nondash--supervisor/worklog-407.md`.
- Drift entry records the major wrap-do-not-reinvent finding and the `@orpc/otel` resolution.
- `@orpc/otel` is pinned at `^1.14.7` in the root npm catalog and consumed by
  `packages/telemetry/package.json` as `catalog:`.
- Focused rework gates passed: scoped check/lint/fmt for telemetry/AI/SDK/service, telemetry oRPC
  tests, AI TelemetryPort tests, SDK service-client tests, workers dispatcher tests, and telemetry
  `deno publish --dry-run --allow-dirty`.

## T7 / #408 - Query Contract and Aspire Adapter

T7 landed on `main` before this rework. See `worklog-408.md` in the T7 branch history for original
per-slice implementation notes and gate results.

## Rebase Resolution - PR #568 after T5/T7 landed

Date: 2026-07-08

- Rebasing `feat/407-telemetry-t6-orpc-spans` onto `origin/main` produced conflict markers only in
  shared harness artifacts: `context-pack.md`, `drift.md`, and `worklog.md`.
- Resolution was additive: retained T5 span-link/fan-in evidence, T6 oRPC scope, and T7 query
  contract/Aspire adapter evidence.
- Source files continue rebasing after artifact resolution; no tests were skipped or disabled.
