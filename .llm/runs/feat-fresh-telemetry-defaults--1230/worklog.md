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
- RED: focused `define-fresh-app.test.ts` failed 9/10 because configured telemetry registered no
  request middleware (`Expected telemetry defaults to activate a request span`).
- GREEN: `defineFreshApp` now installs one request telemetry middleware by default/configuration and
  none for `telemetry: false`; the full Fresh package passes 216/216 tests.
- The request middleware emits `fresh.request` through the existing package helper with SERVER kind,
  service-name precedence, caller attributes, request method/path, response status, and normalized
  exception reporting.
- Scaffold/Aspire composition is proven without duplicate code: scaffold main passes `name`, while
  the existing app generator's focused 22-step test proves full OTEL env and exporter wiring.
- Caveat judgment: fully false after composition, so the docs marker/call-out and matching debt row
  were removed; emitted-span documentation replaces them.

## Gate evidence

| Gate | Result |
| --- | --- |
| Fresh focused RED | expected FAIL, 9 passed / 1 failed before implementation |
| `packages/fresh` test task | PASS, 216 passed / 0 failed |
| `packages/fresh` check task | PASS |
| Aspire `generateRegisterApps` focus | PASS, 22 steps |
| Scoped check | PASS, 180 files / 0 findings |
| Scoped lint | PASS, 180 files / 0 findings after one type-only import correction |
| Scoped fmt | PASS, 180 files / 0 findings |
| `deno task quality:gate` | PASS; repository warnings are pre-existing |
| Structured doc lint | no new server-entrypoint diagnostics; 44 pre-existing query/route/streams diagnostics reported |
| JSR audit | PASS after moving/adding two public-entrypoint `@module` tags; two pre-existing warnings remain non-blocking |

## Reconcile

- #1230 remains the sole closing issue; PR #1282 is the draft commit trail.
- No issue or PR comment changed scope.
- D6 continues to replace local evaluator files with draft→ready augmentation plus the orchestrator
  pre-merge gate.
- Acceptance reconciliation: all four issue boxes earned, cited, and exactly mirrored in PR #1282;
  mirror dry-run passed at head `9ac6cc19e` before the ready label.
