# beta6-nondash Supervisor Context Pack

## Current Slice

- Slice: T6 / issue #407 — oRPC TracingPlugin + SDK CLIENT span + AI TelemetryPort + workers
  metrics.
- Branch: `feat/407-telemetry-t6-orpc-spans`.
- Base confirmed: `c8f68721` (`origin/main`), with T3 present at `c9a703bf`.
- Plan state: user reports beta.6 plan already passed PLAN-EVAL; this session did not re-plan.

## Implemented

- `packages/telemetry/src/orpc/tracing-plugin.ts` starts real `rpc.server` SERVER spans through the
  shared tracer seam, extracts W3C trace headers, and annotates the same active span with procedure
  metadata.
- `packages/sdk/src/client/http-client-link.ts` wraps outbound oRPC fetches in `rpc.client` CLIENT
  spans and injects W3C headers from the client span context.
- `packages/ai/src/agent/loop.ts` accepts `TelemetryPort` injection and records run/turn spans plus
  usage/tool metadata through the port only.
- `packages/telemetry/src/instrumentation/worker.ts` owns shared worker metric instruments and a
  recording helper.
- `plugins/workers/worker/job-dispatcher.ts` emits worker active/processed/failed metrics through
  shared telemetry instrumentation.

## Validation Summary

- Scoped check wrappers passed for `packages/telemetry`, `packages/sdk`, `packages/ai`, and
  `plugins/workers`.
- Scoped lint wrappers passed for the same four roots.
- Scoped format wrapper passed for the four roots (`filesSelected=306`, `failedBatches=0`,
  `findings=0`).
- Doc-lint combined totals: telemetry 0, sdk 0, ai 0, plugin-workers 14 existing private type refs.
- Publish dry-runs passed for telemetry, sdk, ai, and plugin-workers without `--allow-slow-types`.
- Focused tests passed for telemetry oRPC, SDK service-client integrations, AI agent loop/runtime,
  and workers dispatcher.

## Drift

- No plan or doctrine divergence recorded for T6.
- `deno.lock` changed during validation and was reverted before commit.
