# beta6-nondash supervisor context pack

Status: TEL-T6 rework is active on `feat/407-telemetry-t6-orpc-spans`, rebased onto
`origin/main` after T5 / #406 and T7 / #408 telemetry sibling work landed.

## Baseline

- Branch: `feat/407-telemetry-t6-orpc-spans`.
- Original beta.6 base confirmed at `c8f68721`; T3 commit present in history.
- Base updated on 2026-07-08 to include `origin/main` after T5 / #406 and T7 / #408.
- User reports beta.6 plan already passed PLAN-EVAL; this session is an owner-directed rework of
  PR #568 rather than a fresh planning slice.

## T5 / #406 present from main

- Shared telemetry exports `SpanLinkPort`, meter/propagator provider public types, and
  `createFanInLinks`.
- Streams-core has publish and subscribe fan-in tracing.
- Sagas-core owns the shared OTEL saga tracer/facade and seven saga metric instruments.
- Plugin sagas consumes the shared core facade; the old plugin-local tracer path remains a
  compatibility re-export.

## T6 / #407 current scope

- Replace the bespoke oRPC span lifecycle in
  `packages/telemetry/src/orpc/tracing-plugin.ts` with first-party `@orpc/otel`
  `ORPCInstrumentation`.
- Keep the NetScript telemetry seam as the composition point and move NetScript-specific
  `netscript.*` attributes to active-span customization via `trace.getActiveSpan()`.
- Preserve prior acceptance: real SERVER spans, CLIENT spans where applicable, W3C context
  propagation, `netscript.*` attributes, AI `TelemetryPort` invocation, and worker instrumentation.

## T7 / #408 present from main

- `@netscript/telemetry/query` exports the query read-side contract and Aspire-backed adapter.
- Query read models cover traces, spans, logs, resources, metrics, span events, span links, and OTLP
  JSON export.
- `AspireTelemetryQuery` wraps Aspire dashboard `/api/telemetry/*` HTTP endpoints and absent-Aspire
  empty-result degradation.

## Validation snapshot

- T5 pre-merge evidence from main: check/fmt/lint wrappers green for 277 files; focused telemetry
  tests 13 passed; telemetry doc-lint and publish dry-run green.
- T7 pre-merge evidence from main: scoped telemetry check/lint/fmt green; focused query/layering
  tests 8 passed; telemetry package tests 45 passed; full export doc-lint green; publish dry-run
  green; no new doctrine failures.
- T6 rework evidence will be recorded in `worklog-407.md` and the PR #568 implementation comment.

## Constraints

- T5 span-link exports, T6 oRPC exports, and T7 query exports must all remain present.
- Do not touch dashboard/UI/panel code.
- Do not keep `deno.lock` changes unless dependency resolution legitimately requires them for the
  reviewed `@orpc/otel` addition.
- Zero new `as` casts and zero public-surface `any`.
- Push with an explicit refspec: `git push origin HEAD:refs/heads/feat/407-telemetry-t6-orpc-spans`.

## Next

- Finish the `@orpc/otel` rework and focused gates.
- Re-fetch and rebase on latest `main`.
- Push PR #568 with an explicit refspec.
- Leave a PR comment with rework summary, pinned `@orpc/otel` version, commit hash, and gate
  evidence.
