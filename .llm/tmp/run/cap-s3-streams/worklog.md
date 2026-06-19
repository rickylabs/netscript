# Worklog — cap-s3-streams

## Design

- **Public surface:** `plugins/streams/src/public/stream-api.ts` owns
  `defineStreamTopic`, `defineStreamProducer`, `defineStreamConsumer`, and the stream handle types
  exported through `plugins/streams/mod.ts`.
- **Domain vocabulary:** `StreamTopicDefinition<TPayload>`, `StreamProducerHandle<TPayload>`,
  `StreamConsumerHandle<TPayload>`, `StreamUnsupportedOperationError`, and operation ids
  `stream.publish` / `stream.subscribe`.
- **Ports:** No new runtime port in S3. The existing real transport is
  `@netscript/plugin-streams-core` `createDurableStream`, which publishes State Protocol
  upsert/delete events through `@durable-streams/client`; it is not a generic topic pub/sub
  transport.
- **Constants:** No new exported constants. Operation ids stay local string literals because there
  are two call sites and no registry yet.
- **Commit slices:** S3 single implementation slice: replace silent no-op manifest helper behavior
  with explicit typed unsupported-operation failures; prove with runtime tests; record deferred
  durable topic transport debt.
- **Deferred scope:** Real durable topic transport, consumer SDK, subscribe/unsubscribe delivery
  semantics, and CLI runtime publish/subscribe wiring are deferred. Building them requires
  cross-package runtime contracts beyond this M-sized slice.
- **Contributor path:** Start at `plugins/streams/src/public/stream-api.ts`; future transport work
  should introduce a runtime contract in `@netscript/plugin-streams-core` before changing manifest
  helper behavior back to delivery.

## Decision

Selected option **(b) Honest rejection + debt**.

Transport evidence:

- `plugins/streams/README.md` states this plugin owns manifest metadata and that runtime stream
  primitives live in `@netscript/plugin-streams-core`.
- `packages/plugin-streams-core/src/application/create-durable-stream.ts` provides
  `DurableStreamProducer` and `createDurableStream` for State Protocol entity `upsert`/`delete`
  writes.
- `packages/plugin-streams-core/src/ports/stream-producer-port.ts` has only `upsert`, `delete`,
  `flush`, and `close`; there is no `subscribe` port or generic topic delivery API.
- `plugins/streams/src/public/stream-api.ts` previously returned no-op `publish` and no-op
  unsubscribe behavior. S3 now rejects `stream.publish` and `stream.subscribe` with
  `StreamUnsupportedOperationError`.

STOP-rescope guard outcome: real durable publish/subscribe would require new cross-package
transport infrastructure and a consumer SDK, so S3 did not half-build it. Debt was recorded in
`.llm/harness/debt/arch-debt.md`.

## Files Changed

- `plugins/streams/src/public/stream-api.ts`
- `plugins/streams/src/public/mod.ts`
- `plugins/streams/mod.ts`
- `plugins/streams/tests/public/stream-api_test.ts`
- `.llm/harness/debt/arch-debt.md`

## Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused runtime test | PASS | `rtk proxy deno test --allow-all plugins/streams/tests/public/stream-api_test.ts` — 2 passed, 0 failed |
| Streams plugin tests | PASS | `rtk proxy deno test --allow-all plugins/streams` — 7 passed, 0 failed |
| Scoped check | PASS | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/streams --ext ts,tsx` — 21 files selected, 0 failed batches, 0 diagnostics |
| Touched-scope lint | PASS | `rtk proxy deno lint plugins/streams/src/public/stream-api.ts plugins/streams/src/public/mod.ts plugins/streams/mod.ts plugins/streams/tests/public/stream-api_test.ts` — checked 4 files |
| Lock hygiene | PASS | `git diff --stat origin/main -- deno.lock` — empty after restoring Deno resolution churn |
