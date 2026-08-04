# Research — #1231 app-wide runtime shutdown

## Specification

Issue #1231 requires an app-wide `host.shutdown()` that composes existing drains under one budget,
deterministic ordering/budget/partial-failure tests, caveat removal plus debt closure, and green
archetype gates.

## Current facts

- `@netscript/service` exposes `RunningService.stop()` and bounded per-service teardown.
- Worker runtimes expose `runtime.stop()` and `runtime.shutdown.shutdown()`.
- `MessageQueue.stop()` drains queue consumers.
- `DatabaseAdapter.disconnect()` closes database clients.
- These drains are already implemented and must remain authoritative.
- The graceful-shutdown guide explicitly says no app-wide host exists and carries
  `arch-debt:runtime-app-wide-shutdown-orchestrator`.
- `.llm/harness/debt/arch-debt.md` has one matching open debt entry whose gate is a documented
  app-wide orchestrator used as the primary guide path.
- `@netscript/service` is the top-level service runtime surface and already owns the
  `RunningService` lifecycle, making it the narrowest composition owner without cross-package
  dependencies.

## Public-surface / JSR baseline

- `packages/service/deno.json` has complete name/version/description/exports/publish metadata.
- `deno task doc:lint --root packages/service --pretty` reports zero diagnostics across all three
  entrypoints.
- Planned exports use explicit types and JSDoc; no dependency or export-subpath change is needed.
- Publish dry-run and full export-map doc lint remain final gates.

## Caveat re-judgment

- **Invalidated:** “No single app-wide shutdown orchestrator yet,” its planned badge, manual-only
  composition wording, marker, and matching debt entry.
- **Still true:** service signal automation, standalone-worker signal wiring, Windows `SIGBREAK`,
  hook failure reporting, per-resource drain semantics, and DB-after-ingress ordering guidance.

## Open questions

None that force implementation rework. The fixed phase order and report states are locked in the
plan.

