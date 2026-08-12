# Research — #1405 durable producer rejection taxonomy

Author: orchestrator session (Claude · Opus 5 · high). Baseline `origin/main@01aa12b67`.
Read-only inspection; no code changed in this phase.

## Confirmed defect 1 — close-drain window reports `producer-failed`

`close()` sets `#accepted = false` at
`packages/plugin-streams-core/src/application/durable-stream-producer-supervisor.ts:215` and *then*
delegates to `#closeGracefully()` (`:216`), which first `await`s `flush()` and the connect promise
(`:221-224`) before reaching `this.#transition('stopping', 0)` at `:225`.

For the whole duration of that drain, `#accepted` is `false` while `#state.state` is still `ready`
(or `connecting`/`backoff`). Both rejection selectors fall through to their default arm:

- supervisor `#writeRejectionReason()` — `:467-478`: `#accepted` false, state not
  `stopping`/`stopped` → `default: return 'producer-failed'`.
- façade `stateRejection()` — `create-durable-stream.ts:251-262`: `closed` is true (supervisor
  `get closed()` is `!this.#accepted`, `:109-111`), state not `stopping`/`stopped` →
  `return 'producer-failed'` at `:260`.

Both `upsert` (`create-durable-stream.ts:131-133`) and the second write entry point (`:159-160`) go
through `stateRejection`. So a write arriving during an orderly drain is told the producer failed.
It did not: `#fail()` was never called and `#state.error` is unset.

`#stopImmediately()` does **not** have this hole — it transitions to `stopping` on the line right
after clearing `#accepted` (`:185-186`), with no `await` between.

## Confirmed defect 2 — first-attempt refusal reports `retry-exhausted`

`#failActive()` (`:412-423`) settles every non-`aborted` failure as
`{ status: 'delivery-unknown', reason: 'retry-exhausted' }` (`:418-420`). It has three call sites,
and only one of them is genuine exhaustion:

| Call site | Guard | True cause |
| --- | --- | --- |
| `:302` | `!isRetryable(connected.failure) \|\| attempt === maxAttempts` | **conflated** — either refusal or exhaustion |
| `:346` | `else if (!isRetryable(result.failure))` | **refusal**, can fire on attempt 1 |
| `:350` | `if (attempt === this.#reconnectPolicy.maxAttempts)` | genuine exhaustion |

`:346` is reachable on attempt 1 with `maxAttempts` at any value: the append transport returned a
non-retryable failure, i.e. the server positively refused the write. Nothing was exhausted.

## Public surface impact

The reason unions are declared in
`packages/plugin-streams-core/src/domain/producer-contract-v1.ts`:

- `StreamWriteRejectionReasonV1` `:70-78` — already contains `producer-stopping`.
- `StreamWriteUnknownReasonV1` `:84-87` — `retry-exhausted | transport-aborted | producer-stopped`;
  has **no** member naming a positive refusal.

Both are re-exported from the package root (`packages/plugin-streams-core/mod.ts:44-45`), so they
are published surface. A repo-wide grep finds **no consumer outside `plugin-streams-core/src` that
switches on either union**, so widening `StreamWriteUnknownReasonV1` breaks no in-repo exhaustive
switch. It is still an additive change to a published union and must be treated as such in the PR
body.

## Consequence for the fix shape

1. **Close-drain.** No new public member is needed: `producer-stopping` already exists and already
   means "the producer is shutting down and is not accepting". The defect is that the *selector*
   cannot see the closing state before the `stopping` transition happens. The minimal accurate fix
   is to make the closing intent observable to both selectors from the moment `close()` is entered,
   so they return `producer-stopping` instead of falling through to `producer-failed`. Adding a new
   `producer-closing` member is the alternative; it grows published surface for a distinction
   (graceful drain vs abrupt stop) that the existing vocabulary already covers, and the issue only
   requires "a reason naming the closing state, distinct from `producer-failed`".
2. **Refusal.** A new member of `StreamWriteUnknownReasonV1` **is** required — the issue demands a
   reason naming the refusal *and* that retry-exhaustion keeps its own reason, and no existing
   member means "positively refused". `#failActive` must branch on `isRetryable(failure)` rather
   than only on `failure.kind === 'aborted'`, and `:302` must stop conflating its two guards.

Neither change alters which writes are accepted, rejected, or delivered. `#fail()` is still called
in every path it is called in today; only the settled `reason` string differs.

## Negative tests the acceptance requires

Acceptance box 4 ("a future refactor that collapses them fails") means each reason needs a test that
would go red if the reason regressed to the old value:

1. write issued after `close()` is entered but before the drain completes → settles
   `rejected` / closing reason, **asserted not** `producer-failed`.
2. append transport returns a non-retryable failure on attempt 1, `maxAttempts > 1` → settles
   `delivery-unknown` / refusal reason, **asserted not** `retry-exhausted`, and the attempt count
   observed is 1.
3. append transport returns retryable failures until `maxAttempts` → still settles
   `retry-exhausted`.
4. an existing-behaviour guard that accepted/delivered/rejected classification is unchanged
   (`tests/telemetry/durable-stream-producer-telemetry_test.ts:172-219` already distinguishes
   rejected / dropped / delivery-unknown and must stay green).

## Open decision for the implementer brief

Reuse `producer-stopping` for the close-drain window, or add `producer-closing`. The brief will
**lock reuse of `producer-stopping`** (no published-surface growth where existing vocabulary is
accurate) and require the refusal member to be the only union addition. Divergence goes in
`drift.md`, not into the implementer's discretion.
