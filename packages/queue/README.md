# @netscript/queue

[![JSR](https://jsr.io/badges/@netscript/queue)](https://jsr.io/@netscript/queue)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**A provider-agnostic message queue for NetScript: enqueue and drain background jobs through one
`MessageQueue` contract, auto-discovering a RabbitMQ, Redis, or Deno KV backend from the Aspire
environment.**

Queue code has a habit of marrying its broker: the day you move from Deno KV to RabbitMQ, every
`enqueue` and every consumer changes. `@netscript/queue` keeps the contract and the broker separate.
`createQueue('emails')` inspects the Aspire environment, picks the best available backend, and
returns a `MessageQueue<T>` whose call sites are identical from an in-memory test run to a
production broker. Validation, dead-lettering, and error taxonomy are part of the contract, not
afterthoughts bolted onto one adapter.

## Why teams use it

- **One contract, four backends** — every adapter implements the same `MessageQueue<T>` interface,
  so `enqueue` and `listen` never change when the broker does.
- **Backend auto-discovery** — `createQueue` resolves RabbitMQ, then Redis, then Deno KV from Aspire
  service URLs and environment variables; pin one explicitly with `QueueProvider` plus
  `QueueConnectionOptions`.
- **Typed queues** — `createTypedQueue` adds schema validation on enqueue and dequeue, routing
  invalid messages to discard, throw, or the dead-letter store.
- **Durable dead letters** — terminal failures are recorded through the `DeadLetterStorePort`
  contract, with KV, PostgreSQL, and Redis stores published under dedicated sub-path exports.
- **Lazy adapter graph** — the root export carries only factories, ports, errors, and validation
  helpers; Redis and RabbitMQ drivers load on first use, so common imports stay light.
- **Structured failure taxonomy** — `QueueError` subclasses (`QueueConnectionError`,
  `QueueValidationError`, `QueueHandlerError`, …) and `QueueErrorCode` make failures matchable
  instead of string-parsed.

## Architecture

```mermaid
flowchart LR
    P["createQueue('emails')"] -- "Aspire env<br/>auto-discovery" --> B{"backend"}
    B --> RMQ["RabbitMQ"]
    B --> R["Redis"]
    B --> K["Deno KV"]
    B --> PG["PostgreSQL"]
    RMQ & R & K & PG --> L["listen(handler)"]
    L -- "terminal failure" --> DLQ["Dead-letter store<br/>(KV · Postgres · Redis)"]
```

## Install

```bash
deno add jsr:@netscript/queue@<version>
```

Pin `<version>` to match your installed CLI; bare `jsr:@netscript/*` specifiers do not resolve on
the pre-release line.

## Quick example

```typescript
import { createQueue } from '@netscript/queue';

declare function sendWelcomeEmail(to: string, body: string): Promise<void>;

// Auto-discovers a backend (RabbitMQ → Redis → Deno KV) from the Aspire environment.
const queue = createQueue<{ to: string; body: string }>('emails');

await queue.enqueue({ to: 'user@example.com', body: 'Welcome to NetScript.' });

await queue.listen(async (message) => {
  await sendWelcomeEmail(message.to, message.body);
});
```

For runtime schema validation at enqueue and dequeue time, define the contract with a Zod schema and
build a typed queue:

```typescript
import { z } from 'zod';
import { createTypedQueue } from '@netscript/queue';

const NotificationSchema = z.object({
  type: z.enum(['email', 'sms']),
  to: z.string(),
  body: z.string(),
});

const queue = createTypedQueue('notifications', NotificationSchema, {
  onValidationError: 'dlq',
});
```

## Public surface

| Entry                                   | What it gives you                                                                                    |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `.`                                     | `createQueue`, `createTypedQueue`, `createParallelQueue`, validation helpers, errors, contract types |
| `./ports`                               | Contract types only (`MessageQueue`, `DeadLetterStorePort`, options)                                 |
| `./adapters/deno-kv`                    | Deno KV adapter (native queue operations)                                                            |
| `./adapters/kv-polling`                 | Deno KV polling adapter for hosts without native queue support                                       |
| `./adapters/redis`                      | Redis adapter                                                                                        |
| `./adapters/amqp`                       | RabbitMQ (AMQP) adapter                                                                              |
| `./adapters/postgres`                   | PostgreSQL adapter                                                                                   |
| `./adapters/*-dead-letter-store`        | Durable dead-letter stores for KV, PostgreSQL, and Redis                                             |
| `./validation`, `./errors`, `./testing` | Validation helpers, error taxonomy, test utilities                                                   |

The always-current symbol list is
[`deno doc jsr:@netscript/queue@<version>`](https://jsr.io/@netscript/queue/doc) (pin `<version>` on
the pre-release line, as above).

## Docs

- **Reference — factories, adapters, and exports**:
  [rickylabs.github.io/netscript/reference/queue/](https://rickylabs.github.io/netscript/reference/queue/)
- **Background Processing — how queues fit the background stack**:
  [rickylabs.github.io/netscript/background-processing/](https://rickylabs.github.io/netscript/background-processing/)
- **How-to: choose a queue provider**:
  [rickylabs.github.io/netscript/how-to/choose-a-queue-provider/](https://rickylabs.github.io/netscript/how-to/choose-a-queue-provider/)
- **API docs on JSR**: [jsr.io/@netscript/queue/doc](https://jsr.io/@netscript/queue/doc)

## Compatibility

Redis delayed-message promotion is at most once across listeners sharing a delayed key. The adapter
opens its dedicated promotion connection lazily and caches Lua support once per client (transport
failures leave capability undetermined). With scripting available, each due member is removed and
pushed atomically by Lua; only a successful `ZREM` can push its recorded envelope. The script is
loaded once and batches send `EVALSHA`, reloading/retrying once on `NOSCRIPT`. `redis.pcall` catches
a failed `LPUSH` and restores the member at its original score inside the same script. Immediate
ready-list enqueues/dequeues cannot abort this path. Both keys are passed explicitly as `KEYS`, and
envelope bytes/routing are unchanged.

Servers without scripting, including Garnet with Lua disabled, use `WATCH`/`MULTI`/`EXEC`. Only the
delayed set is watched; hot ready lists are type-checked in a pipelined preflight without WATCH.
Wrongly typed targets found in preflight are logged and retained. This fallback accepts the narrow
race where a target is changed to a non-list after preflight: Redis does not roll back EXEC, so that
race can lose the member. Queue keys must stay absent or lists while consumers operate. A connection
epoch counts close/end/ready events; a changed epoch abandons the snapshot before MULTI so a
reconnect cannot commit it without WATCH. Delayed-set writes can still abort this path: each poll
has three attempts per batch with 1–5 ms jitter, then defers to the next 1 s poll. Continuous
delayed writes therefore have no fixed promotion-latency bound.

Both paths read at most 100 due members per attempt and continue while a full batch is promoted, up
to ten batches (1,000 members) per pass. Larger backlogs continue on the next 1 s poll; no batch
allocates or reads the whole backlog. There is no poison-member skip/quarantine: 100 retained
wrongly typed targets can block valid members behind them, and invalid JSON halts its batch. Repair
those keys/members to resume progress. Handler retries still require idempotency. The promotion
client disables the offline queue: best-effort polls fail fast and quietly while connecting or
reconnecting. Unexpected pass failures are logged once, and timer rejections are caught. Shutdown
disconnects all clients and races the active pass against its manual-disconnect signal, abandoning
unresolved work even when ioredis emits no close event. A manually closed client never reconnects;
abandoned server-side operations either committed atomically or wrote nothing.

The existing `netscript:queue:<name>`, `netscript:processing:<name>`, and `netscript:delayed:<name>`
key layout is unchanged and targets single-node Redis-compatible servers. Redis Cluster is outside
this adapter's supported scope: these keys have no shared hash tag, so multi-key transactions and
blocking pop-push operations can cross hash slots.

Designed for Deno. The Deno KV backend needs the `kv` unstable feature (`--unstable-kv`); Redis,
RabbitMQ, and PostgreSQL backends need `--allow-net` plus `--allow-env` for discovery. Backend
auto-discovery reads Aspire-style service environment variables and falls back to Deno KV when no
broker is advertised.

## License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
