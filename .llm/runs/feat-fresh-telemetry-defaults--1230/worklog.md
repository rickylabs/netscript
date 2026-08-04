# Worklog — #1230 Fresh telemetry defaults

## Design

- Public surface: existing `defineFreshApp`, `DefineFreshAppOptions.telemetry`,
  `FreshAppTelemetryOptions`, and `FreshAppTelemetryAttribute`; no new entrypoint.
- Domain vocabulary: `fresh.request`, service identity, static app attributes, request method/path,
  response status.
- Ports: existing global OTEL tracer accessed through the package telemetry helper.
- Constants: default service name and request span/operation names live beside the middleware.
- Fluent/bootstrap shape: scaffold calls `defineFreshApp({ name })`; the composition root installs
  defaults automatically unless `telemetry: false`.
- Validation: request-level active-span regression, package task/check, scoped check/lint/fmt,
  quality gate, doc lint/JSR audit, and existing scaffold/Aspire generator assertion.
- Contributor path: extend app-bootstrap telemetry in the dedicated server telemetry module, then
  exercise it through `define-fresh-app.test.ts`.
- Deferred: browser telemetry, provider/exporter registration, metrics.

## Progress

- Bootstrap and contract research recorded.

