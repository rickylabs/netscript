# Plan — #1231 app-wide runtime shutdown

## Profile and verdict

- Archetype 3 runtime/behavior concern, embedded in the existing Archetype-4
  `@netscript/service` package surface because the host owns app lifecycle rather than a new
  package.
- Service and docs overlays.
- Current doctrine verdict: `@netscript/service` is “Refactor”; this slice must not deepen that
  baseline.
- In-scope anti-patterns: AP-3, AP-5, AP-10, AP-11, AP-12, AP-13, AP-16, AP-19, AP-20, AP-22,
  AP-25.

## Locked decisions

1. Export `createRuntimeHost(options)` from `@netscript/service`; return a small `RuntimeHost`
   handle with idempotent `shutdown(reason?)`.
2. Accept `RuntimeHostDrain` structural callbacks. Consumers wrap the existing
   `service.stop()`, worker shutdown, `queue.stop()`, and `database.disconnect()` methods; the host
   does not reimplement any drain.
3. Use the fixed phase vocabulary `service`, `workers`, `queue`, `database`, in that order. Preserve
   registration order within a phase.
4. Use one budget timer for the entire sequential run. At expiration, mark the active drain
   `timed-out`, remaining drains `skipped`, and return immediately; never wait beyond the budget for
   an uncooperative drain.
5. Continue after a rejected drain and return normalized per-drain failures in deterministic order.
6. Inject the timer into the internal runtime class; isolate real timers in an adapter. Tests use a
   controlled timer and no wall-clock sleeps.
7. Replace the docs caveat with the primary `createRuntimeHost()` path, remove the marker, and
   delete the debt entry. Retain all warnings that remain factually true.

## Open-decision sweep

- Safe to defer: automatic OS-signal installation for the app host; callers may route signals to
  `host.shutdown()`, while existing service and worker signal behavior remains documented.
- Safe to defer: forced cancellation of per-resource internals; existing drains retain ownership.
- Must resolve now: none.

## Commit slices

1. **S0 — research and locked design.** Files: run artifacts. Gate: plan checklist plus D6 waiver.
2. **S1 — host contract and behavior.** Files: service runtime, timer adapter, root exports, tests,
   README, run artifacts. Gates: focused deterministic tests; scoped check/lint/fmt; doc lint;
   quality/architecture review.
3. **S2 — caveat burn-down and close evidence.** Files: graceful-shutdown guide, debt registry,
   PR/run evidence. Gates: caveat-marker search, docs source alignment, package tests, JSR audit and
   publish dry-run.

## Required gates

- Focused deterministic ordering, exhaustion, and partial-failure tests.
- Full `packages/service` tests.
- Scoped wrapper check/lint/fmt for owned TypeScript.
- `quality:scan` and `arch:check` with baseline attribution.
- Full-export `doc:lint`, package publish dry-run, JSR package audit.
- Consumer import/type check of the root export.
- Docs marker/debt search and source-alignment review.
- Separate-session formal IMPL-EVAL.

## Risk register

- **Slow drain keeps running after report:** attach rejection handling before racing; the host return
  is bounded, but ownership stays with the existing drain.
- **Timer leak on fast completion:** cancel the single timer in `finally`.
- **Ambiguous reports:** reject duplicate ids and record exactly one ordered outcome per drain.
- **Docs overclaim signal ownership:** document host composition separately and keep standalone
  signal caveats.
- **Lock churn:** never stage `deno.lock`; inspect status after every Deno command.

## Deferred scope

- No new per-resource drain implementation.
- No signal-listener abstraction.
- No Aspire process-orchestrator changes.
- No dependency changes or unrelated service restructuring.

