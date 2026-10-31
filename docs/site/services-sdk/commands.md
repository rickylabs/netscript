---
layout: layouts/base.vto
title: Transactional commands
description: Commit business changes, replay receipts, audit and outbox intents together.
templateEngine: [vento, md]
order: 31
---

# Transactional commands

A command is a named mutation whose business write, replay receipt, audit and outbox intents share
one database commit. Import definitions and execution from `@netscript/service/commands`; import
production persistence from `@netscript/database/commands/postgres`. Commands complement your
[contract and service handlers](/services-sdk/services/). They do not start a listener, authenticate
a request, schedule a retry or deliver a message.

Start with the executable example below, then read [Relay committed intents](/services-sdk/command-relay/),
[Operations and reconciliation](/services-sdk/command-operations/), [Security](/services-sdk/command-security/)
and [Compatibility](/services-sdk/command-compatibility/). The [service reference](/reference/service/#command-definitions-and-codecs)
lists the public exports.

## Run an atomic command

This self-contained example uses the **published testing subpath** and an in-memory store. Save the
fence as `counter.ts` in a consumer with matching NetScript dependencies, `@std/assert` and `zod` installed, then
run `deno run counter.ts`. It needs no runtime permissions. It demonstrates transaction semantics;
it does not qualify a real database or deliver the outbox message. The documentation gates compile
this fence and separately execute its assertions using only public entrypoint mappings.

```ts
import { assertEquals, assertRejects } from '@std/assert';
import { CommandError, createCommandExecutor, defineCommand, jsonCodec } from '@netscript/service/commands';
import { createMemoryCommandStore, type MemoryCommandBusiness } from '@netscript/service/commands/testing';
import { z } from 'zod';

type Input = { amount: number; failAfterWrite: boolean };
type Output = { value: string };
const COMMAND_NAME = 'counter.increment';
const COMMAND_VERSION = 1;
const DESTINATION = 'workers';
const TOPIC = 'counter.changed';
const store = createMemoryCommandStore();
const response = jsonCodec(z.object({ value: z.string() }));
const command = defineCommand<typeof COMMAND_NAME, Input, Output, MemoryCommandBusiness>({
  name: COMMAND_NAME,
  definitionVersion: COMMAND_VERSION,
  idempotency: {
    scope: ({ actor }) => `counter:${actor.kind}:${actor.subject}`,
    fingerprint: (input) => input,
    response,
  },
  records: { audit: 'required', outbox: 'required' },
  async handle(ctx) {
    const current = ctx.tx.get('counter');
    if (ctx.envelope.expectedVersion !== (current ?? '0')) ctx.conflict();
    const value = String(Number(current ?? '0') + ctx.envelope.input.amount);
    if (!ctx.tx.compareAndSet('counter', current, value)) ctx.conflict();
    ctx.audit({ action: COMMAND_NAME, subject: { type: 'counter', id: 'primary' } });
    ctx.publish({ destination: DESTINATION, topic: TOPIC, payload: { value }, codec: response });
    if (ctx.envelope.input.failAfterWrite) throw new Error('demonstration rollback');
    return { value };
  },
});
const executor = createCommandExecutor({ store });
const envelope = {
  input: { amount: 1, failAfterWrite: false },
  actor: { kind: 'principal' as const, subject: 'reader-1' },
  correlationId: 'request-1',
  idempotencyKey: 'counter-request-0001',
  expectedVersion: '0',
};
const first = await executor.execute(command, envelope);
assertEquals(first.outcome, 'applied');
assertEquals(first.value, { value: '1' });
const committed = store.snapshot();
assertEquals([committed.receipts.length, committed.audit.length, committed.outbox.length], [1, 1, 1]);
assertEquals(committed.business.counter, '1');

// A lost response is reconciled by replaying the same semantic request and key.
const replay = await executor.execute(command, { ...envelope, correlationId: 'request-2' });
assertEquals(replay.outcome, 'replayed');
assertEquals(replay.value, first.value);
assertEquals(replay.correlationId, 'request-1');
assertEquals(store.snapshot(), committed);

// A new request with an old version conflicts. No receipt or side effect commits.
const conflict = await assertRejects(() => executor.execute(command, {
  ...envelope, idempotencyKey: 'counter-request-0002',
}), CommandError);
assertEquals(conflict.failure.kind, 'optimistic_conflict');

// Reusing a successful key for changed input fails before the handler runs.
const mismatch = await assertRejects(() => executor.execute(command, {
  ...envelope, input: { amount: 2, failAfterWrite: false },
}), CommandError);
assertEquals(mismatch.failure.kind, 'idempotency_key_reuse');

// Even a failure after a business write and buffered records rolls everything back.
await assertRejects(() => executor.execute(command, {
  ...envelope,
  expectedVersion: '1',
  idempotencyKey: 'counter-request-0003',
  input: { amount: 1, failAfterWrite: true },
}), Error, 'demonstration rollback');
assertEquals(store.snapshot(), committed);
console.log('command guide: atomic commit, replay, conflict, mismatch and rollback passed');
```

The example's input is a trusted local value. At a service boundary, validate the request with your
contract schema, require a finite allowed amount, authenticate and authorize the actor, then create
the envelope. The executor freezes bounded I-JSON; it does not run your contract's input schema.

## Put every database write on the supplied transaction

`ctx.tx` is the business handle bound by the store's interactive transaction. Use it for the domain
mutation, including the conditional version update. Never call a root database client from the
handler. `ctx.audit` and `ctx.publish` buffer intents synchronously without transport I/O. The
executor validates the response, appends audit, appends outbox, completes the receipt and awaits
commit before returning `CommandExecution`.

For production PostgreSQL, compose the shipped store with the consumer's generated callback bridge:

```ts
import { createCommandExecutor } from '@netscript/service/commands';
import type { TransactionClientPort } from '@netscript/database/commands';
import { createPostgresCommandStore, type PostgresCommandClient } from '@netscript/database/commands/postgres';

declare const database: TransactionClientPort<PostgresCommandClient>;
const store = createPostgresCommandStore(database, { transactionTimeoutMs: 5000 });
const executor = createCommandExecutor({ store, receiptClaimWaitMs: 1000 });
```

`database` is an application-supplied bridge to the actual generated transaction callback, not a
root-client assertion or a new connection. Give it your generated business delegates in addition to
`PostgresCommandClient`, and type the command's transaction parameter accordingly. Apply the
consumer-owned receipt/audit/outbox models, constraints and migrations before execution. See the
[PostgreSQL adapter reference](/reference/database/#postgresql-command-adapter).

The executor calls the handler at most once per attempt. Driver callback retries, nested
transactions and external effects inside the handler violate that boundary. A custom store must
provide the same-commit guarantees and pass [conformance checks](/services-sdk/command-compatibility/#qualify-a-custom-store).

## Expected version and idempotency are different controls

`expectedVersion` is an opaque normalized **string token**, not an automatic database lock. Compare
it in the same atomic conditional update as the business write. Check affected-row count and call
`ctx.conflict()` if it loses. In a real counter, keep a separate version column when the value can
repeat; the teaching example uses a monotonic counter value as its version.

Required idempotency keys are the default. A key is 16–256 UTF-8 bytes. Scope selects the semantic
namespace; fingerprint selects all mutation-relevant input. Both callbacks must be deterministic
and have no I/O, time, randomness or mutable closure state. Request identity also includes command
name, `definitionVersion`, actor kind/subject and expected version. Correlation, trace and actor
scheme are transport context and do not change request identity.

After commit, the same key and semantic identity return the original decoded value and correlation
without rerunning the handler or appending records. Changed input, actor identity, definition version
or expected version under the same receipt namespace rejects key reuse. Changing scope or command
name creates a different namespace and can execute again. Do not generate a new key to recover a
lost response. Optional unkeyed commands skip receipts and cannot promise replay.

## Persist only bounded records

`records.audit` and `records.outbox` are `required`, `optional` or `forbidden`. Required means at
least one validated intent must be recorded; policy failures roll back. Supply a synchronous,
identity-preserving `jsonCodec` for response and outbox payloads. Schema transforms, defaults that
change the value and async validation are refused. Persist JSON primitives, arrays and plain
objects, not dates, classes, cycles, undefined or non-finite numbers.

`CommandExecution.outcome` is `applied` or `replayed`; `idempotency` is `claimed`, `replayed` or
`not_requested`. These describe the local command boundary. They do not say that a worker ran or
that a webhook receiver committed. Follow the committed intent through the
[relay](/services-sdk/command-relay/) and [reconciliation runbook](/services-sdk/command-operations/).
