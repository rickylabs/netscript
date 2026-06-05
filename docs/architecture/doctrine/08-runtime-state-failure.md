# Runtime, State, and Failure

Axioms governed: A12, A13.

A subset of NetScript packages own *long-running behavior*. Workers
run jobs over time. Sagas walk state machines across event streams.
Triggers fire, retry, and surface delivery results. These packages
need a doctrine that goes beyond shape and reaches into how state,
time, and failure are modeled.

## Stateful packages — a different bar

A stateful package owes its callers four things:

1. **A named state model.** A plain TypeScript type whose shape is
   the entire instance state. Not implicit, not partial.
2. **A named lifecycle.** The phases an instance goes through, in
   order, with explicit terminal states.
3. **An identity mechanism.** A correlation id (or job id, run id,
   instance id) externalized so the rest of the system can refer
   to instances by name.
4. **A failure model.** What happens when a handler throws, when an
   adapter is unavailable, when time runs out, and when a duplicate
   message arrives.

If any of those four is missing, the package is not yet a stateful
package — it is a queue of side effects.

## The state-machine archetype — sagas

For sagas (and only sagas — see *what is not a saga* below), the
doctrine adopts the Wolverine/MassTransit shape:

```ts
defineSaga<UserRegistrationState, UserRegistrationEvents>('user-registration')
  .state(({ initial }) => initial({ status: 'pending' }))
  .during('pending', (s) =>
    s.on('UserRegistered', (saga, event) => {
      saga.state.email = event.email;
      saga.state.status = 'welcoming';
      return [send('SendWelcomeEmail', { email: event.email })];
    })
  )
  .during('welcoming', (s) =>
    s.on('WelcomeEmailSent', (saga) => {
      saga.state.status = 'completed';
      return [saga.complete()];
    })
  )
  .timeout('5m', { in: 'welcoming' }, (saga) => [saga.fail('welcome timeout')])
  .compensation((saga, reason) => [send('UndoWelcome', { email: saga.state.email })])
  .build();
```

Required properties:

- **State is a named type** with discriminator. `status` is the
  discriminator; the type narrows accordingly.
- **Phases are named** (`pending`, `welcoming`, `completed`,
  `failed`). Generic "handler" code that branches on string status
  inside its body is a smell; the DSL forces the branch up.
- **Handlers are pure.** A handler takes `(saga, event)`, mutates
  `saga.state`, and returns *cascaded messages*. It does not call
  the bus directly.
- **Time is first-class.** `timeout()` schedules a delayed message
  scoped to a phase.
- **Compensation is explicit.** A saga declares how to undo
  partially-completed side effects.
- **Correlation is part of the contract.** Each saga has a
  `correlationId` derived from the inbound message; the saga store
  is keyed off it.
- **Persistence is a port.** `SagaStorePort` has `load`,
  `save`, and `delete` keyed by correlation id; adapters supply
  Postgres, KV, in-memory.

Testability: a saga's handlers can be tested as pure functions
without spinning up the bus. A handler test takes a state plus an
event, asserts the new state and the cascaded messages. This is the
property Jeremy Miller calls out for Wolverine; the doctrine
preserves it.

### What is *not* a saga

These look saga-shaped but are not, and forcing them into the saga
DSL is the wrong abstraction:

- **Workers/jobs.** A unit of work with a single payload, an
  outcome, and at most a retry policy. No multi-step state machine.
  Use `defineJob()` (Archetype 3 runtime/behavior shape).
- **Triggers.** An external event arrives, the system fans it out
  to handlers, delivery is tracked. State per delivery is small
  (delivered / failed / retrying). Use `defineTrigger()` and
  `defineTriggerHandler()`. A trigger that genuinely orchestrates
  multiple steps over time is *not* a trigger any more — it is a
  saga, and should be modeled as one.
- **Streams.** A stream of values flowing through transforms. State
  is in the stream operator (windowing, debouncing). Use
  `ReadableStream` + `TransformStream`. No saga needed.

The discipline is: only call something a saga when the state
machine has at least three named phases and at least one
compensation case. Below that bar, simpler primitives win.

## Time as a first-class input

> The clock is an injected port.

Every stateful package holds a `ClockPort`:

```ts
export interface ClockPort {
  now(): Temporal.Instant;
  monotonic(): bigint;
  schedule(at: Temporal.Instant, fn: () => Promise<void>, signal: AbortSignal): Promise<void>;
}
```

Properties:

- The system clock is the default
  (`new SystemClock()`); tests use `new FakeClock()` (in `testing/`).
- A handler that calls `Date.now()` directly is a violation. The
  clock is the seam.
- Scheduling lives on the clock or on a dedicated scheduler port
  (workers may need both).

## Cancellation propagation

> Every async path receives an `AbortSignal`.

Rules:

- `start()` returns a handle whose `stop()` aborts an internal
  controller and awaits drain.
- The signal flows through to every adapter call, every fetch,
  every long-running loop.
- Loops that cannot be interrupted (e.g. tight CPU loops) periodically
  check `signal.aborted` and yield.
- A package never holds a `setTimeout` without a way to clear it on
  shutdown; the clock port owns scheduling.

Anti-patterns:

- A `Worker` that runs forever with no shutdown path.
- A `Saga` engine whose `drain()` returns immediately without
  flushing in-flight messages.

## Crash boundaries — supervision

> Handlers throw rich errors. Supervisors decide what to do.

Doctrine for stateful packages:

- The runtime spawns *workers* (logical, not Web Workers
  necessarily) under a *supervisor*.
- The supervisor knows the **strategy** (one-for-one, one-for-all,
  rest-for-one), the **maximum restarts**, and the **time window**.
- A handler throws on unexpected failure. It does not `try/catch`
  and swallow.
- The supervisor catches, normalizes the error (see *error
  normalization* below), records telemetry, decides:
  - *Restart* — same input, fresh worker.
  - *Move-on* — drop the input, log it, continue.
  - *Escalate* — the parent supervisor decides.
  - *Halt* — stop the runtime; the caller's `stop()` resolves
    with the supervision result.

The terminology is borrowed from Erlang/OTP without porting OTP
verbatim. We do not need `gen_server`, `gen_statem`, `gen_event`.
We need the *separation* between what does the work and what
decides whether to retry.

## Error normalization

> Errors crossing a supervisor or a runtime boundary are normalized
> into a structured incident record.

```ts
export interface NormalizedError {
  readonly code: string;             // 'worker.task.timeout'
  readonly message: string;
  readonly stack?: string;
  readonly cause?: NormalizedError;
  readonly correlationId?: CorrelationId;
  readonly attempt?: number;
  readonly tags: Readonly<Record<string, string | number>>;
  readonly capturedAt: string;       // ISO timestamp
}
```

Rules:

- Normalization happens in *one place per package* — a
  `default-error-normalizer.ts` in `diagnostics/`.
- The normalizer is the only code that calls `console.error` or
  emits structured logs. Handlers never log raw errors.
- The normalized record is what telemetry, JSON reporters, and the
  CLI presentation layer consume.
- The original error is preserved in `cause` so a developer
  reading the log can drill back.

## Idempotency, ordering, and exactly-once

A stateful package documents its delivery guarantees:

- **At-most-once** — a message may be lost; never delivered twice.
- **At-least-once** — a message may be delivered twice; never lost.
- **Exactly-once-effective** — at-least-once plus deduplication via
  idempotency keys.

NetScript's runtime packages default to *at-least-once with
idempotency keys*. The contract is:

- Every inbound message carries an idempotency key.
- The handler's effects are keyed on it.
- The store records "applied keys" and rejects duplicates with a
  structured "already applied" outcome that the supervisor records
  but does not treat as a failure.

A package that does not declare its delivery guarantee is
incomplete. The README states it.

## Concurrency

A stateful package declares its concurrency model:

- **Per-instance serial** — each saga / job correlated to id `X`
  processes events for `X` one at a time, in order.
- **Per-handler parallel** — handlers run concurrently across
  different correlation ids.
- **Bounded fan-out** — `pooledMap` from `@std/async` with a named
  concurrency budget.

The package exposes the concurrency budget as a configuration
field, not as a constant.

## Concrete repo examples

### `@netscript/sagas`

Verdict: structurally on the right track. The DSL and store/transport
ports exist. Doctrine deltas:

- Make compensation declarations a first-class builder method.
- Ensure every transport and store implements an explicit
  `AbortSignal` propagation contract.
- Add a fitness test: every saga definition has at least one
  terminal phase declared.

### `@netscript/workers`

Verdict: the runtime exists; the executor is monolithic
(`task-executor.ts` 1,287 LOC). Doctrine deltas:

- Split executor into dispatcher, supervisor, telemetry reporter,
  error normalizer, retry policy applier.
- Make supervision strategy configurable per worker pool.
- Document delivery semantics in the README.

### `@netscript/triggers`

Verdict: scattered top-level files. Doctrine deltas:

- Lift state model into `state/`.
- Lift dispatch into `application/runtime/`.
- Lift action execution into `application/executor/`.
- Make per-trigger delivery a small named state machine
  (`pending → delivered | failed`) with explicit retry budget.

## Stateful-package checklist

- [ ] Named state type and named phases (or a single state shape
      for non-state-machine packages).
- [ ] Identity exposed externally as a typed identifier
      (correlationId, jobId, runId).
- [ ] Clock injected as a port; `Date.now()` not called inside
      handlers.
- [ ] `AbortSignal` plumbed through every async path; `stop()`
      method on every running handle.
- [ ] Supervisor separate from worker; handlers throw, supervisor
      decides.
- [ ] One error normalizer per package; structured incident records.
- [ ] Delivery guarantee declared in the README and tested.
- [ ] Concurrency budget configurable; default documented.
- [ ] Compensation explicit for sagas; idempotency keys for
      at-least-once handlers.
