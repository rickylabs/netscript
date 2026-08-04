# Research — #1230 Fresh telemetry defaults

## Specification

Issue #1230 requires the existing `defineFreshApp` telemetry option to emit through the existing
OTEL surface, make scaffolded-app telemetry visible in Aspire, close the matching docs/debt caveat
only if it is no longer true, and pass the Archetype 4 gates.

## Current baseline

- `DefineFreshAppOptions.telemetry` accepts `boolean | FreshAppTelemetryOptions`, but runtime code
  never reads it. The option is therefore a reserved-but-dead seam.
- The scaffolded Fresh entry point already calls `defineFreshApp({ name: appName })`.
- Aspire app registration already injects the full OTEL environment and an HTTP/protobuf exporter
  for every app resource. Repeating exporter setup in `packages/fresh` would cross the composition
  boundary.
- `@netscript/fresh` already emits package spans through
  `src/internal/package-telemetry/telemetry.ts`, backed by `@netscript/telemetry/tracer` and Deno's
  global OTEL provider.
- The caveat marker and call-out are in `docs/site/web-layer/server.md`; the matching open debt is
  in `.llm/harness/debt/arch-debt.md`.

## JSR/public-surface scan

The public option and exported attribute type already exist. Activating their semantics does not
require a new export or dependency. JSDoc must stop saying “reserved/future,” and the full export
map must remain doc-lint clean. No slow-type risk is introduced when the middleware factory has an
explicit return type.

## Open questions

None that force rework. Exact span naming and precedence are locked in `plan.md`.

