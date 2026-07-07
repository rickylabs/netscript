# beta6-nondash supervisor worklog

## T5 / #406 — SpanLinkPort fan-in links

Date: 2026-07-08

Tier-D WSL Codex implementation slice on branch `feat/406-telemetry-t5-span-links`.
PLAN-EVAL was supplied as PASS by the supervisor prompt; this slice did not re-plan.

### Scope

- Promoted provider-aware fan-in span-link construction into `@netscript/telemetry` application
  layer via `createFanInLinks(messages, spanLinks)`.
- Wired streams-core producer spans with W3C trace-header injection and consumer subscribe spans with
  SDK-preserved fan-in link attributes.
- Moved saga OTEL tracer/facade implementation into `@netscript/plugin-sagas-core/telemetry`, leaving
  the plugin-local tracer file as a thin compatibility re-export.
- Updated saga telemetry attributes and metric names to the `netscript.*` convention and added the
  seven shared saga metric instruments.
- Added tests for SDK link attributes, Deno-native dropped-link attributes, streams producer/consumer
  spans, saga fan-in links, and shared saga meters.

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

- `deno.lock` churn appeared during Deno validation after package import-map additions and publish
  dry-run. It was reverted per #406 constraints.
- No plan or doctrine divergence recorded for this slice.
