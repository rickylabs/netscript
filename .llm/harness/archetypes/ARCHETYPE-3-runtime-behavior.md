# Archetype 3 — Runtime / Behavior

## Doctrine Reference

- Axioms: A1, A2, A4, A5, A8, A9, A10, A11, A12, A13, A14.
- Primary sections:
  - `docs/architecture/doctrine/03-base-and-derived-classes.md`
  - `docs/architecture/doctrine/05-folder-structure.md`
  - `docs/architecture/doctrine/06-archetypes.md#archetype-3--runtimebehavior`
  - `docs/architecture/doctrine/08-runtime-state-failure.md`
  - `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md`
- Anti-patterns: AP-1, AP-3, AP-4, AP-5, AP-6, AP-8, AP-10, AP-11, AP-12, AP-13, AP-16, AP-17,
  AP-19, AP-20.
- Fitness functions: F-1, F-2, F-3, F-4, F-5, F-6, F-7, F-8, F-9, F-10, F-11, F-12, F-13, F-14,
  F-15.

## When This Archetype Applies

Use this profile when the package owns long-running behavior: workers, triggers, sagas, watchers,
runtimes, supervisors, dispatch loops, retry, delivery, or stateful lifecycle.

Sagas use this profile with the state-machine specialization described in
`docs/architecture/doctrine/08-runtime-state-failure.md`.

## Minimum Folder Shape

Use the canonical shape in `docs/architecture/doctrine/06-archetypes.md#archetype-3--runtimebehavior`. The package
needs named state, lifecycle, ports, runtime/application split, diagnostics, and tests that prove
cancellation and failure behavior.

## Skills to Activate

- `netscript-doctrine`
- `jsr-audit` when publishability is in scope
- `aspire` when runtime validation depends on the distributed app

## Read First

1. `docs/architecture/doctrine/06-archetypes.md#archetype-3--runtimebehavior`.
2. `docs/architecture/doctrine/08-runtime-state-failure.md`.
3. `docs/architecture/doctrine/03-base-and-derived-classes.md` if classes or inheritance change.
4. The runtime README, definitions/builders, state model, runner, supervisor, adapters, and
   diagnostics.
5. Existing tests around retries, cancellation, delivery, and errors.
6. Relevant debt entries.

## Required Gates in Order

1. Static gates: package/slice checks, fmt, lint, doc lint, publish dry-run.
2. Fitness gates: all F-1 through F-15.
3. Runtime gates: required. Validate lifecycle, stop handles, cancellation, backend health where
   applicable, and representative traces/logs.
4. Consumer gates: required when definitions, builders, runtime contracts, or exported handles
   change.

## Anti-Patterns to Watch For

- AP-1: executor, transport, or dispatcher monolith.
- AP-6: base class with concrete lifecycle behavior.
- AP-10: handler catches errors that the supervisor should decide.
- AP-11: hidden globals for stores, clocks, telemetry, or queues.
- AP-12: direct time and timer use inside handlers.
- AP-13: `console.*` in published runtime code.

## False-Done States

- Static checks pass but no runtime start/stop path was exercised.
- A new async path ignores `AbortSignal`.
- Retry or failure logic works in the happy path only.
- README omits delivery guarantees, concurrency, permissions, or stop semantics.
- Sagas have handlers but no terminal or compensation story where required.

## Rescope Triggers

- The runtime needs a supervisor split not named in the plan.
- State shape or lifecycle phases are implicit or missing.
- An executor file must be split before the requested change can be safe.
- Runtime validation requires Aspire resources or external services not available in the current
  session.

## Design Checkpoint Expectations

The design checkpoint must name state shape, identity, lifecycle phases, supervisor boundary, clock
port, cancellation path, delivery guarantee, concurrency model, and diagnostics before
implementation.

The design section in `worklog.md` must include:

- state type and lifecycle enum/union,
- ports for clock, transport, and external dependencies,
- constants for states, event kinds, or delivery modes,
- commit slices: state+lifecycle first, then runner/supervisor, then adapters, then consumer
  integration,
- contributor path for adding a new handler or lifecycle hook.

## Concept of Done

Beyond the universal slice checklist in `workflow/run-loop.md`:

- start, stop, and failure paths are exercised by tests or runtime gates,
- async paths respect `AbortSignal`,
- the README documents delivery guarantees, concurrency, and stop semantics,
- sagas have terminal and compensation paths where required.

## Historical Notes

Runtime packages can appear done because `deno check` is green. The closure bar is behavior: start,
stop, failure, retry, cancellation, and consumer impact.
