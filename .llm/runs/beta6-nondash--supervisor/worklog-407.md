# #407 T6 Telemetry Worklog

## Design

### Public Surface

- `@netscript/telemetry/orpc`
  - `registerORPCInstrumentation(config?)` enables upstream `@orpc/otel` `ORPCInstrumentation`.
  - `TracingPlugin` keeps the existing service plugin shape, delegates oRPC SERVER/CLIENT span
    lifecycle to upstream instrumentation, and annotates the active upstream span.
  - `TracingPluginOptions.instrumentationConfig` passes through upstream configuration.
  - `TracingPluginOptions.instrumentation` / `activeSpanProvider` are test/composition seams; the
    production path uses `ORPCInstrumentation.enable()` and `trace.getActiveSpan()`.
- `@netscript/sdk/client`
  - `createServiceClient` HTTP link wraps outbound fetches in `rpc.client` CLIENT spans and injects
    W3C headers from that span.
- `@netscript/ai/agent`
  - `AgentLoopDeps.telemetry?: TelemetryPort`, defaulting to no-op.
  - Agent-loop run/turn telemetry records through the injected AI `TelemetryPort`.
- `@netscript/telemetry/instrumentation`
  - `WorkerMetricValues`, `WorkerMetricInstruments`.
  - `createWorkerMetricInstruments`, `getWorkerMetricInstruments`,
    `recordSharedWorkerMetrics`.
- `@netscript/plugin-workers`
  - Worker dispatcher emits active/processed/failed job metrics through shared telemetry
    instrumentation.

### Domain Vocabulary

- Span names: `rpc.server`, `rpc.client`, `gen_ai.chat`, `gen_ai.chat.turn`.
- Span kinds: upstream `@orpc/otel` owns oRPC middleware SERVER/CLIENT lifecycle; the SDK outbound
  HTTP adapter still records CLIENT spans where applicable.
- Shared metric names: `netscript.worker.active_jobs`, `netscript.worker.jobs.processed`,
  `netscript.worker.jobs.failed`, `netscript.worker.job.duration`.
- Attribute roots: upstream `rpc.*`, `gen_ai.*`, `server.*`; NetScript-owned `netscript.*`.

### Ports

- `packages/ai` consumes its existing package-owned `TelemetryPort`; the agent loop accepts the port
  by constructor/factory injection and never imports `@netscript/telemetry` or an ad-hoc tracer.
- Worker metrics are constructed in `@netscript/telemetry/instrumentation`, so the plugin consumes
  the shared instrumentation layer.
- oRPC telemetry is registered through the telemetry package's oRPC adapter seam; NetScript code
  does not call `startSpan` / `end` for oRPC server spans.

### Constants

- `@orpc/otel` version `^1.14.7` in the root npm catalog.
- `SpanNames.RPC_CLIENT`
- `SpanKind.SERVER`
- `SpanKind.CLIENT`
- `WorkerAttributes.WORKER_ID`

### Commit Slices

1. T6 oRPC/sdk/ai/workers telemetry parity — original implementation commit.
2. T6 oRPC rework — replace bespoke oRPC server span lifecycle with `@orpc/otel`, preserve SDK
   client spans, AI TelemetryPort usage, and shared worker metrics with focused tests and gates.

### Deferred Scope

- Flow-B full scaffold runtime E2E is intentionally not run in T6; T8 owns that gate.
- No service builder routing changes; existing service oRPC wiring keeps using `TracingPlugin`.
- No package-wide doc-lint cleanup for pre-existing plugin-workers private type references.

### Contributor Path

- oRPC tracing lives in `packages/telemetry/src/orpc/tracing-plugin.ts`.
- SDK outbound propagation lives in `packages/sdk/src/client/http-client-link.ts`.
- AI model-loop telemetry lives in `packages/ai/src/agent/loop.ts` and stays behind
  `TelemetryPort`.
- Worker metric instruments live in `packages/telemetry/src/instrumentation/worker.ts`; plugins call
  `recordSharedWorkerMetrics`.

## Evidence

| Gate | Result |
| --- | --- |
| `deno task deps:latest --filter @orpc/otel` | exit 0; before adding the dep, wrapper reported `0 behind / 0 total`; `deno doc npm:@orpc/otel` resolved stable `1.14.7` |
| `deno doc npm:@orpc/otel` | exit 0; public surface is `ORPCInstrumentation` and `ORPCInstrumentationConfig` |
| `deno add npm:@orpc/otel@^1.14.7` from `packages/telemetry` | exit 0; normalized to npm catalog entry `@orpc/otel: ^1.14.7` and package dependency `catalog:` |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/telemetry --ext ts,tsx` | exit 0; `filesSelected=83`, `failedBatches=0`, `totalOccurrences=0` |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/sdk --ext ts,tsx` | exit 0; `filesSelected=56`, `failedBatches=0`, `totalOccurrences=0` |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/ai --ext ts,tsx` | exit 0; `filesSelected=77`, `failedBatches=0`, `totalOccurrences=0` |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/workers --ext ts,tsx` | exit 0; `filesSelected=90`, `failedBatches=0`, `totalOccurrences=0` |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/telemetry --ext ts,tsx` | exit 0; `filesSelected=83`, `totalOccurrences=0` |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/sdk --ext ts,tsx` | exit 0; `filesSelected=56`, `totalOccurrences=0` |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/ai --ext ts,tsx` | exit 0; `filesSelected=77`, `totalOccurrences=0` |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/workers --ext ts,tsx` | exit 0; `filesSelected=90`, `totalOccurrences=0` |
| `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/telemetry --root packages/sdk --root packages/ai --root plugins/workers --ext ts,tsx` | exit 0; `filesSelected=306`, `failedBatches=0`, `findings=0` |
| `deno task doc:lint --root packages/telemetry --pretty` | exit 0; `combinedTotal=0` |
| `deno task doc:lint --root packages/sdk --pretty` | exit 0; `combinedTotal=0` |
| `deno task doc:lint --root packages/ai --pretty` | exit 0; `combinedTotal=0` |
| `deno task doc:lint --root plugins/workers --pretty` | exit 0; `combinedTotal=14` existing private type refs outside this slice's changed worker dispatcher |
| `deno publish --dry-run --allow-dirty` from `packages/telemetry` | exit 0; no `--allow-slow-types` |
| `deno publish --dry-run --allow-dirty` from `packages/sdk` | exit 0; no `--allow-slow-types` |
| `deno publish --dry-run --allow-dirty` from `packages/ai` | exit 0; no `--allow-slow-types`; existing dynamic import warnings in MCP adapter |
| `deno publish --dry-run --allow-dirty` from `plugins/workers` | exit 0; no `--allow-slow-types`; existing dynamic import warnings |
| `deno test --allow-env packages/telemetry/tests/orpc/plugin_test.ts packages/telemetry/tests/testing/in-memory-span-recorder_test.ts` | exit 0; 6 passed |
| `deno test --allow-all packages/sdk/tests/integration/service-client-runtime_test.ts packages/sdk/tests/integration/workers-trigger-rpc_test.ts` | exit 0; 5 passed |
| `deno test --allow-all packages/ai/tests/agent_loop_test.ts packages/ai/tests/runtime_test.ts` | exit 0; 15 passed |
| `deno test --allow-all plugins/workers/worker/job-dispatcher_test.ts` | exit 0; 3 passed |

## Rework Evidence - 2026-07-08

| Gate | Result |
| --- | --- |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/telemetry --root packages/ai --root packages/sdk --root packages/service --ext ts,tsx` | exit 0; `filesSelected=265`, `failedBatches=0`, `totalOccurrences=0` |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/telemetry --root packages/ai --root packages/sdk --root packages/service --ext ts,tsx` | exit 0; `filesSelected=265`, `totalOccurrences=0` |
| `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/telemetry --root packages/ai --root packages/sdk --root packages/service --ext ts,tsx` | exit 0; `filesSelected=265`, `failedBatches=0`, `findings=0` |
| `deno test --unstable-kv --allow-all packages/telemetry/tests/orpc/plugin_test.ts packages/ai/tests/agent_loop_test.ts packages/ai/tests/runtime_test.ts` | exit 0; 19 passed |
| `deno test --unstable-kv --allow-all packages/sdk/tests/integration/service-client-runtime_test.ts packages/sdk/tests/integration/workers-trigger-rpc_test.ts plugins/workers/worker/job-dispatcher_test.ts` | exit 0; 8 passed |
| `deno publish --dry-run --allow-dirty` from `packages/telemetry` | exit 0; no `--allow-slow-types`; no slow-type warnings |
| `rg -n "\sas\s|\bany\b|startSpan|withSpan|contextWithSpan|getParentContextFromHeaders" packages/telemetry/src/orpc/tracing-plugin.ts packages/telemetry/tests/orpc/plugin_test.ts` | exit 1; no matches, confirming no new casts/`any` and no bespoke oRPC span lifecycle helpers in the reworked files |

## Reconcile Note

- Pre-flight base was `c8f68721`; T3 was present at `c9a703bf`.
- Issue #407 acceptance was read; milestone is `0.0.1-beta.6` (GitHub milestone number 8).
- Original `deno.lock` churn occurred during Deno resolution and was reverted before the first T6
  commit. The rework keeps a reviewed `deno.lock` diff for the new `@orpc/otel` runtime dependency.
- `deno task e2e:cli` was not run per T6 constraints.
- Rework preserves the prior T6 acceptance paths: upstream oRPC instrumentation now owns SERVER
  span lifecycle, SDK CLIENT spans and W3C injection remain in `packages/sdk`, AI TelemetryPort
  tests still pass, and worker dispatcher instrumentation tests still pass.
