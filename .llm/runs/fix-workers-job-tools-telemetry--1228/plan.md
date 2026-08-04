# Locked Plan — workers scaffold job tools telemetry (#1228)

Status: **LOCKED** before implementation.

## Profile and doctrine

- Archetype 5 — Plugin Package, with the core-owned runtime convention folded in.
- Docs scope overlay for caveat and debt removal.
- Primary axioms: A1, A5, A6, A10, A13, A14; plugin thinness law.

## Locked decisions

### D1 — Core owns the helper contract and behavior

Add the typed `JobTools` surface and `createJobTools(ctx)` composition to
`@netscript/plugin-workers-core`; both official scaffold `job-tools.ts` files become thin re-exports.
This removes duplicated convention logic from first-party plugins.

### D2 — Delegate to the existing telemetry machinery

- `trace.addEvent` records the caller's exact event name on the active job span.
- `trace.withChildSpan` delegates to the real job-domain child-span helper.
- `trace.recordProgress(current,total,unit)` delegates to real `job.progress` emission.
- `progress(percent,message)` emits a `job.progress` event using `percent / 100 / percent` and also
  forwards to `ctx.reportProgress`, preserving the runtime progress channel.
- `traceContext` remains the W3C headers from the handler context; logging remains console-backed.

### D3 — The regression test observes production defaults

Use a real OpenTelemetry global provider, async context manager, and in-memory exporter. Invoke the
ordinary one-argument `createJobTools(ctx)` inside an active parent span and assert the exported
parent events, progress attributes, child span, child attributes/events, and progress callback.
No injected telemetry fake is used, so silently restoring no-op production defaults fails.

### D4 — Caveats close claim by claim

Delete the matching debt row and remove/rewrite every statement whose truth condition is helper
inertness. Retain console/logging and other unrelated caveats. Remove all five structured markers
only after the runtime test is green.

## Open-decision sweep

- No must-resolve decisions remain.
- Safe to defer: structured logger integration; custom progress message as an OTel attribute;
  changing the established helper signatures; broader telemetry API redesign.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| A fake-only test passes while defaults remain inert | Exercise the one-argument public factory through a real global provider/exporter. |
| Child span loses active parent | Assert parent/child trace IDs and distinct span IDs. |
| Progress callback regresses while OTel passes | Assert both callback payload and `job.progress` event attributes. |
| Plugin becomes a second telemetry implementation | Core delegates to existing telemetry primitives; scaffold files only re-export. |
| Over-removing caveats | Audit each paragraph; retain console-backed logging and unrelated limitations. |
| Lock churn | Stage explicit files and verify `deno.lock` absent from `origin/main...HEAD`. |

## Validation plan

1. RED: focused production-default job-tools telemetry test fails against the current stubs.
2. GREEN: focused test and relevant workers-core/plugin tests.
3. Scoped check/lint/fmt wrappers for touched core/plugin roots.
4. `quality:gate`, full export-map doc lint, JSR audit, and publish dry-run for touched published
   packages.
5. Smallest runtime/consumer proof: focused real-provider test plus official-plugin copy tests; run
   broader plugin/runtime smoke only if these surfaces expose integration drift.
6. Docs source alignment and structured caveat marker sweep.

## Debt

Close only `workers-scaffold-job-tools-noop`. Create no replacement debt unless implementation
discovers a distinct unresolved violation.

## Deferred scope

- Trace-correlated structured logging.
- New helper methods or signature changes.
- Telemetry backend/provider configuration.
- General workers executor refactoring.

