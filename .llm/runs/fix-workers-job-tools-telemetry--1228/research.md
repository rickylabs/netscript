# Research — workers scaffold job tools telemetry (#1228)

## Specification provenance

The live issue was read first through `gh issue view`, the connector, and the REST API. Its body is
literally `(see above)` and it has no comments. The concrete two-part specification therefore comes
from the owner's dispatch: wire trace/span/progress helpers to real telemetry with a no-op-resistant
test, then remove only the caveats and debt made false by that behavior.

## Current-main findings

1. `plugins/workers/jobs/job-tools.ts` and `plugins/triggers/jobs/job-tools.ts` duplicate the same
   `JobTools` contract and no-op span implementation. `progress()` forwards only to the optional
   context callback; `trace.addEvent`, `trace.recordProgress`, and `trace.withChildSpan` emit no
   telemetry.
2. Real worker telemetry already exists in `@netscript/telemetry/instrumentation`:
   `withChildSpan`, `recordJobProgress`, active-span lookup, and span event recording. The workers
   runtime establishes the active job execution context and propagates W3C trace headers.
3. Convention-bearing helper behavior belongs in `@netscript/plugin-workers-core`; first-party
   plugin scaffold files should wire/re-export it rather than duplicate it (Archetype 5 thinness).
4. Five structured `workers-scaffold-job-tools-noop` caveat markers exist, but additional unmarked
   prose repeats the same false no-op claim. Logging remains console-backed and is a distinct,
   still-true caveat.
5. The matching open debt row closes only when events/progress/child spans really emit and a runtime
   test observes a handler child span at an OpenTelemetry collector/recorder boundary.
6. The foreign `deno.lock` modification predates this branch and must remain outside every commit.

## JSR surface scan

- `@netscript/plugin-workers-core` and the official workers/triggers plugins are published JSR
  packages. Adding the helper to the existing root export changes a public surface, so explicit
  return types/JSDoc, full export-map doc lint, package audits, and publish dry-runs are required.
- No new export subpath is needed. The existing core root and existing scaffold-local import path
  remain the contributor surfaces.
- The new core dependency on `@netscript/telemetry` must use the workspace's pinned JSR mapping and
  must not introduce lock churn into the PR.

## Caveat audit rule

Remove or rewrite claims specifically saying trace/progress helpers are inert. Preserve independent
claims about console-backed logging, OTLP configuration, framework-level automatic spans, and any
other deployment/stream limitations.

