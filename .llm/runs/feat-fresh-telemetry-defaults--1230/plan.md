# Plan — #1230 Fresh telemetry defaults

## Profile

- Surface: `packages/fresh` composition root plus its scaffold/Aspire consumer evidence and docs.
- Archetype: 4 — Public DSL / Builder.
- Overlay: frontend (server bootstrap; no visual UI change).
- Doctrine posture: preserve the existing public seam and materialize it through the existing
  package telemetry adapter.

## Locked decisions

1. `telemetry` defaults to enabled; `false` is the explicit opt-out.
2. Service-name precedence is `telemetry.serviceName`, then `name`, then `fresh-app`.
3. A server request middleware emits `fresh.request` through the existing Fresh telemetry helper,
   using `SpanKind.SERVER`, static caller attributes, request method/path, and response status.
4. The middleware sits after static files and before caller middleware/routes, preserving the
   documented bootstrap order while making downstream request work part of the active span.
5. Aspire exporter/resource wiring remains in the scaffold's existing app registration seam.
6. The caveat and debt entry close only after runtime, scaffold, docs, and gates all substantiate
   that the seam is active.

## Commit slices

1. Bootstrap the harness plan and draft PR. Gate: issue/doctrine/current-main research review.
2. Prove and implement active defaults, then close truthful docs/debt. Gate: RED-first focused test,
   `packages/fresh` test/check, scoped wrappers, quality gate, doc/JSR audit, scaffold generator test.
3. Compose D6 evaluation evidence and ready handoff. Gate: acceptance mirror dry-run and current PR
   checks; orchestrator owns pre-merge readiness.

## Risks and mitigations

- Global OTEL setup is runtime-owned: use `@netscript/telemetry/tracer`; do not register a provider.
- Static attribute precedence could overwrite request facts: apply static attributes first and
  framework-derived request/status facts last.
- A test could pass while the option stays inert: assert a downstream middleware observes an active
  span specifically when `defineFreshApp` handles a request.
- Scaffold/Aspire could drift independently: retain focused generator evidence for app OTEL env and
  the scaffolded `name` call.

## Open-decision sweep

- Safe to defer: richer HTTP semantic attributes and metrics beyond the issue's defaults.
- Must resolve now: none.

## Deferred scope

- Provider registration, exporter configuration, metrics, and browser telemetry remain owned by
  Deno/Aspire and the telemetry package.

