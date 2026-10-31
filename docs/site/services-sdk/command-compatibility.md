---
layout: layouts/base.vto
title: Command and relay compatibility
description: Evolve command identity, codecs and persistence without repeating committed effects.
templateEngine: [vento, md]
order: 35
---

# Command and relay compatibility

The [command guide](/services-sdk/commands/) describes the current public subpaths, not a future
standalone command package. Import `@netscript/service/commands`, `/commands/relay` and
`/commands/testing` explicitly. Keep service, database, worker and telemetry dependencies on a
compatible published release. Verify the exact release's export map before adoption; an older
installed package need not contain these subpaths merely because current source does.

## Preserve replay semantics during a rollout

| Change | Effect and rollout policy |
| --- | --- |
| Correlation, trace or actor scheme | Excluded from semantic identity; replay still returns the original correlation. |
| Selected input or expected version | Same-key request mismatch; resolve conflicts as a new intentional request rather than mutating a retry. |
| Actor kind/subject | Included in request identity; a different actor in the same namespace mismatches. A scope including actor identity can instead choose another namespace. |
| `definitionVersion` | Included in the request hash, not a new receipt namespace: old keys under the same scope/name reject changed versions. Keep the old definition available for old retries. |
| Name or scope | Changes the receipt namespace; the same key can execute again. Never rename to bypass a receipt. |
| Response codec | Replay decodes persisted material with the definition's codec. Preserve old-format decoding or retain a compatible old definition; codec failures are not permission to execute again. |
| Outbox destination/topic/payload | Existing rows remain durable old-format intents. Retain old sink registrations and payload schemas until backlog and supported replay windows are handled. |

Maintain a finite allowlist of definitions/versions in the service and any telemetry adapter.
Changing a handler under an unchanged version/key does not rerun completed requests: replay returns
the old value. Test old receipts, current input and delayed deliveries during rolling upgrades.
The opaque original object returned by `defineCommand` carries the private handler binding; copied
or reconstructed definitions are not executable definitions.

`jsonCodec` requires canonical identity preservation in both directions. Async schemas or
transforms/defaults that change canonical JSON cannot be used to migrate persisted records.
Use reviewed application migrations/explicit compatible codecs and keep rollback compatibility
for outstanding receipts and deliveries.

## Choose a store with real transaction guarantees

The shipped durable adapter is `createPostgresCommandStore` from
`@netscript/database/commands/postgres`, paired with the consumer-owned generated callback bridge
and migrated models. It invokes work once, binds all side writes to that same transaction and
reports completion after commit/rollback. PostgreSQL receipt claim waits must be 1–60,000 ms; an
unbounded zero setting is refused. The memory testing store's immediate contention and simulated
`sqlite` provider vocabulary do not certify a production SQLite store, or any MySQL/MSSQL driver.

`createCommandStoreCapabilities` describes the bound implementation: interactive transactions,
same-commit side records, one callback attempt, cancellation mode and supported isolation/wait
policy. It does not manufacture those guarantees. An adapter advertising them must actually enforce
them. Select isolation only from the adapter's supported set. Importing or constructing the stores
runs no DDL and opens no database resource; migrations and connection lifecycle remain application-owned.

The shipped PostgreSQL relay adapter requires the reviewed outbox model, constraints and incremental
acceptance columns/indexes before use. Apply normal application migrations, including the installed
sagas outbox schema contribution when that plugin owns the model; do not run DDL in the relay.
`bindPostgresCommandOutbox` exists for an atomic producer already inside a real transaction, such as
a saga transition. It binds only outbox appends to that callback; it does not add command receipts,
audit or a nested transaction. See the [database reference](/reference/database/#bound-postgresql-command-writer).

## Qualify a custom store

This Tier-1 compiled testing example uses the public testing kit. The definition/envelope and
provider fixture are supplied by your own test. A fixture must start empty, expose committed
inspection, support deliberate corruption/negative controls and own driver cleanup.

```ts
import type { CommandDefinition, CommandEnvelope } from '@netscript/service/commands';
import {
  assertCommandDeterminism,
  createCommandFaultController,
  createMemoryCommandStore,
  createTestingCommandExecutor,
  runCommandConformance,
  type CommandConformanceFactory,
} from '@netscript/service/commands/testing';

type Input = { value: string };
declare const definition: CommandDefinition<'sample.update', Input, string, object>;
declare const envelope: CommandEnvelope<Input>;
declare const createProviderFixture: CommandConformanceFactory<object>;
await assertCommandDeterminism(definition, envelope, 4);
await runCommandConformance(createProviderFixture);

// Separate testing-only executor: production options have no fault injection.
const faults = createCommandFaultController();
const executor = createTestingCommandExecutor({ store: createMemoryCommandStore() }, faults);
faults.failNext('after_commit_before_return', new Error('simulated response loss'));
```

The last block arms a one-use boundary fault; execute an appropriate memory-store definition to
exercise it. A postcommit response-loss fault leaves committed state intact and the next same-key
attempt must replay. Precommit faults must roll back business, receipt, audit and outbox together.
`runCommandConformance` checks these invariants, mismatch, CAS, busy, corruption, cancellation and
outside-transaction negative controls. `assertCommandDeterminism` samples 2–32 calls; passing four
samples is not a universal proof of purity. Keep database-specific tests for real locking,
isolation, pool settings and driver cancellation. The compiled example is not evidence that a
particular production driver passed conformance.

## Retention and downstream compatibility

Preserve command receipts as long as the application promises idempotent retries. Outbox
`pruneSettled` is a separate bounded cleanup operation; it does not delete command receipts or audit
records. Align its window with worker/receiver dedupe retention and authorized operator replay.
See [retention operations](/services-sdk/command-operations/#prune-only-settled-unleased-rows).

Worker acceptance schemas and job payload schemas remain worker-owned. Bare queue/status responses
are incompatible with the checked command sink. A published marker and normalized acceptance are
written together, but no upgrade can turn that marker into exactly-once remote delivery. Retain the
[outbound-webhooks recipe's](/orchestration-runtime/how-to/outbound-webhooks/)
stable delivery identity, signing and receiver deduplication across producer/worker/receiver rollouts.
