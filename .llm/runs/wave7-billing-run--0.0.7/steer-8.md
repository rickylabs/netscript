Product owner steer #8. **A framework defect, verified in the 0.0.7 engine source — your saga
compensation cannot reach a terminal state, and your tests cannot detect that.**

I verified this myself against `v0.0.7` of `@netscript/plugin-sagas-core`, not from docs:

- `saga-engine.ts` — `#persistTransition` is the **only** store write, and it is called from exactly
  **one** site (line 321), on the `.on()` path.
- `saga-compensator.ts` — **zero** `store.` writes. Nothing a `.compensate()` handler returns or
  mutates is ever persisted.
- `saga-bus-bridge.ts` routes a compensation cascade back into the compensator, never back through
  the engine.
- `saga-engine.ts:540` — `isTerminalStatus()` **includes `'compensating'`**. Once written, nothing
  reopens the instance.

**Consequence:** `run-issue`'s `[sagaFail(reason)]` and `payment-refund`'s `[]` produce the
*identical* persisted outcome — `compensating`, forever. The comments at `run-issue-saga.ts:24-28`
("the engine fails the instance after the compensation runs") and `payment-refund-saga.ts:103-105`
("the saga never rests in `compensating`") are **false against this runtime**. The MCP guidance you
followed says the engine "records cancellation, and then fails the instance" — that is prose 0.0.7
does not implement. **You followed the docs correctly; the docs are wrong.**

Your six green saga tests call the handler functions directly, so they stay green through the whole
defect. They certify a capability the system does not have.

## Fix — entirely in your own code, no framework change

1. **Move the undo into the effector job.** `sagas/run-issue-saga.ts:204` runs
   `void executeCompensationRefund(...)` detached, on the saga runner, caught by a `console.error`,
   on an instance the store already treats as terminal. **Kill that process mid-refund and the
   customer keeps the charge and nothing re-drives it.** For a billing product that is the one bug
   that ends the product. Lift the refund verbatim into `workers/jobs/run-item-issue.ts` — it is
   async, retried by workers, and durable.
2. **Terminalise from `.on()`, the only path that persists.** Add a `RunItemCompensated` message
   (and `payment.refund.compensated`), publish it from the job *after* the undo is durable, and
   handle it: `.on('RunItemCompensated', (saga, e) => { …; return [sagaFail(e.payload.reason)]; })`.
   That `sagaFail` **is** persisted as `failed`.
3. **Reduce `.compensate()` to the routing no-op it honestly is**, returning `[]`.
4. **Replace the tests with a runtime test.** Use `createTestSagaRuntime` from
   `@netscript/plugin-sagas-core/testing` (already in your `deno.json`) with a `MemorySagaStore`,
   publish the forward messages then the failure, and **assert on
   `store.load(instanceId).metadata.status`** — not on a handler's return value. That test goes red
   today. Make it pass. That single assertion is the capability no build in this series has proved.
5. **Record it as a framework defect** in your record with this exact evidence: *"`.compensate()`
   return values and state mutations are never persisted; `plugin-sagas-core@0.0.7`
   `saga-bus-bridge.ts` re-enters `SagaCompensator`, never `SagaEngine#persistTransition`; and
   `isTerminalStatus` treats `compensating` as terminal."* This is a genuine finding and one of the
   most valuable things this build will produce — the docs promise behaviour the engine does not
   implement. Do not soften it, and do not let it disappear into "unfamiliarity".

## Also, in priority order

- **Nothing reads the saga proof surface.** Zero product hits for `/api/v1/sagas/instances` or
  `/subscribe`. Your `sagaState` column is written by a worker and rendered nowhere — `grep saga`
  over `routes/runs/**` returns nothing. Add a sagas client, show the real instance state on the
  run-item row, and subscribe to the SSE feed. **That is the screenshot the product exists for.**
- **`STREAMS_DATA_DIR` is unset**, so stream history is in-memory and dies on restart. One line in
  the streams block. For a product whose thesis is *durable* inspection, that is the wrong failure.
- **`triggers/daily-maintenance.ts` is still the empty scaffold** — `return []`, bound to no job. A
  billing product whose period never closes unattended has no product.
- **`verifier: 'memory'` is still shipped** on a public path that accepts any POST. Delete the
  orphaned scaffold trigger or give it a real signature verifier.
- Delete the `user-registration` scaffold saga — it will list next to your real ones at
  `GET /api/v1/sagas/sagas`.
- `sagas/mod.ts` omits the `PaymentRefundSaga` exports.

## Verified good — do not regress these

`.correlate()` on both sagas with per-item keys, matching `correlationKey` from both effectors.
Jobs are schema-backed via `defineJobHandler`, registered, and the triggered id matches.
Run-level idempotency is real — `issueRun` and `resumeRun` both wrap status flip, audit write and
per-item triggers in one `withIdempotency`. `traceparent` is threaded correctly through both jobs.
The stream chain shares one schema module between producer and browser island.

Keep parallelising: frontend screens, this saga fix, and the remaining seams at once.
