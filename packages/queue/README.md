# @netscript/queue

[![JSR](https://jsr.io/badges/@netscript/queue)](https://jsr.io/@netscript/queue)
[![Deno](https://img.shields.io/badge/runtime-Deno-000000?logo=deno&logoColor=white)](https://deno.com/)
[![License](https://img.shields.io/badge/license-MIT-0f172a)](https://opensource.org/licenses/MIT)

Provider-agnostic message queues for NetScript and Deno applications. The package wraps Deno KV,
Redis, RabbitMQ, and KV-polling backends behind a single `MessageQueue` contract while keeping the
root import focused on the core factories, types, errors, and validation helpers.

## Features

- **Unified queue contract** — Use the same `MessageQueue<T>` API across all supported providers.
- **Auto-discovery** — Detect RabbitMQ, Redis, or Deno KV from Aspire environment variables.
- **Typed queues** — Add runtime schema validation with `createTypedQueue()`.
- **Lightweight root import** — Heavy Redis and RabbitMQ adapters stay behind explicit subpath
  imports.
- **Native retry awareness** — Expose whether the selected backend handles retries for you.
- **Durable dead-letter queue** — Terminal failures are recorded through `DeadLetterStorePort` on
  every default adapter.
- **KV Connect fallback** — Switch to the polling adapter automatically when native Deno KV queue
  APIs are unavailable.
- **Tracing integration** — Auto-wrap queues with `@netscript/telemetry` when telemetry is enabled.
- **Validation helpers** — Reuse `safeValidate`, `validateOrThrow`, and `withValidation` with Zod or
  compatible schemas.

## Install

```sh
deno add jsr:@netscript/queue
```

The root package works without manually importing provider adapters. Import subpaths only when you
need direct access to a specific backend adapter.

## Quick Start

Use the root factory when you want the package to auto-detect the best available queue backend.

```ts
import { createQueue } from '@netscript/queue';

const queue = createQueue<{ to: string; body: string }>('emails');

await queue.enqueue({
  to: 'user@example.com',
  body: 'Welcome to NetScript.',
});

await queue.listen(async (message) => {
  await sendEmail(message.to, message.body);
});
```

## Entry Points

| Import                                                 | Purpose                                                    | Key exports                                                               |
| ------------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| `@netscript/queue`                                     | Root factories, core types, errors, and validation helpers | `createQueue`, `createTypedQueue`, `createParallelQueue`, `QueueProvider` |
| `@netscript/queue/ports`                               | Queue interfaces, option types, and DLQ contract           | `MessageQueue`, `MessageContext`, `QueueOptions`, `DeadLetterStorePort`   |
| `@netscript/queue/errors`                              | Stable queue error types                                   | `QueueError`, `QueueValidationError`, `QueueErrorCode`                    |
| `@netscript/queue/validation`                          | Schema validation helpers                                  | `ValidationSchema`, `safeValidate`, `validateOrThrow`, `withValidation`   |
| `@netscript/queue/adapters/deno-kv`                    | Direct Deno KV adapter access                              | `DenoKvAdapter`                                                           |
| `@netscript/queue/adapters/kv-polling`                 | KV Connect and regular KV polling queue                    | `KvPollingAdapter`                                                        |
| `@netscript/queue/adapters/kv-dead-letter-store`       | KV-backed DLQ store                                        | `KvDeadLetterStore`                                                       |
| `@netscript/queue/adapters/postgres-dead-letter-store` | PostgreSQL DLQ store                                       | `PostgresDeadLetterStore`                                                 |
| `@netscript/queue/adapters/redis-dead-letter-store`    | Redis DLQ store                                            | `RedisDeadLetterStore`                                                    |
| `@netscript/queue/adapters/redis`                      | Direct Redis adapter access                                | `RedisAdapter`                                                            |
| `@netscript/queue/adapters/amqp`                       | Direct RabbitMQ adapter access                             | `AmqpAdapter`                                                             |

## Usage Examples

### Create a typed queue with runtime validation

```ts
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

### Inject a dead-letter store

```ts
import { createQueue } from '@netscript/queue';
import { KvDeadLetterStore } from '@netscript/queue/adapters/kv-dead-letter-store';

const queue = createQueue('jobs', {
  deadLetterStore: new KvDeadLetterStore({ queueName: 'jobs' }),
});
```

### Force a specific provider

```ts
import { createQueue, QueueProvider } from '@netscript/queue';

const queue = createQueue('jobs', {
  provider: QueueProvider.Redis,
});
```

### Tune Deno KV polling for KV Connect

```ts
import { createQueue } from '@netscript/queue';

const queue = createQueue('jobs', {
  connection: {
    denoKv: {
      path: 'https://kv.example.com',
      pollInterval: 500,
      visibilityTimeout: 60_000,
      maxRetries: 5,
    },
  },
});
```

### Disable automatic tracing when you want manual instrumentation

```ts
import { createQueue } from '@netscript/queue';

const queue = createQueue('jobs', {
  disableAutoTracing: true,
});
```

### Use validation helpers without a typed queue

```ts
import { safeValidate } from '@netscript/queue/validation';

const schema = {
  parse(input: unknown) {
    if (typeof input !== 'string') throw new Error('Expected string');
    return input;
  },
  safeParse(input: unknown) {
    return typeof input === 'string'
      ? { success: true as const, data: input }
      : { success: false as const, error: { message: 'Expected string' } };
  },
};

const result = safeValidate(schema, 'hello');
console.log(result.success);
```

## API Reference

The root entrypoint is centered on three factories:

- `createQueue(name, options?)` returns a queue with provider auto-detection or an explicitly
  selected backend.
- `createTypedQueue(name, schema, options?)` adds enqueue and dequeue validation on top of
  `createQueue()`.
- `createParallelQueue(name, options?)` wraps a queue for concurrent processing when
  `concurrency > 1`.

The core runtime contract is `MessageQueue<T>`, which exposes:

- `enqueue(message, options?)`
- `enqueueMany?(messages, options?)`
- `listen(handler, options?)`
- `stop()`
- `nativeRetrial`

Full generated docs: https://jsr.io/@netscript/queue/doc

## Configuration

### Provider selection

`createQueue()` chooses a provider in this order:

1. `options.provider`
2. RabbitMQ when Aspire reports a `rabbitmq` service
3. Redis when `REDIS_URI`, `GARNET_URI`, `redis`, or `garnet` are available
4. Deno KV as the default fallback

When the chosen Deno KV path is a remote HTTP or HTTPS endpoint, the factory uses `KvPollingAdapter`
because native Deno KV queue operations are not available there.

### `QueueOptions`

```ts
interface QueueOptions {
  provider?: QueueProvider;
  autoDiscover?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  connection?: QueueConnectionOptions;
  deadLetterStore?: DeadLetterStorePort;
  disableAutoTracing?: boolean;
}
```

### `QueueConnectionOptions`

```ts
interface QueueConnectionOptions {
  denoKv?: {
    path?: string;
    verbose?: boolean;
    pollInterval?: number;
    visibilityTimeout?: number;
    maxRetries?: number;
    retryBaseDelay?: number;
    retryMaxDelay?: number;
    deduplicationWindow?: number;
  };
  redis?: {
    url?: string;
    options?: Record<string, unknown>;
  };
  rabbitmq?: {
    url?: string;
    queueName?: string;
  };
  postgres?: {
    url?: string;
    tableName?: string;
  };
}
```

## Delivery Guarantee and Dead Letters

`@netscript/queue` provides at-least-once delivery. A handler may see a message more than once when
a backend redelivers after failure or visibility timeout. Handlers should make side effects
idempotent using application-level keys.

Poison messages are never silently discarded by the default adapters. A terminal failure writes a
`DeadLetterRecord<T>` before the adapter removes or releases the source message. Terminal failures
include:

- `nack({ requeue: false })` from a handler
- max-attempts exhaustion on adapters that own retry counting
- typed-queue validation failures when `onValidationError: 'dlq'`

The `DeadLetterStorePort<T>` extension point is intentionally small:

- `append(record)`
- `list({ limit }?)`
- `reprocess(reenqueue, { limit }?)`
- `depth()`

Default backing stores:

| Adapter                 | Default DLQ store                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| Deno KV                 | `KvDeadLetterStore`                                                                             |
| KV polling / KV Connect | `KvDeadLetterStore` using the adapter KV                                                        |
| PostgreSQL              | `PostgresDeadLetterStore` using `<queue_table>_dlq`                                             |
| Redis                   | `RedisDeadLetterStore` using `netscript:dlq:<queue>`                                            |
| RabbitMQ / AMQP         | `KvDeadLetterStore`; RabbitMQ dead-letter exchanges remain an optional broker-side optimization |
| Memory testing adapter  | `MemoryDeadLetterStore`                                                                         |

`KvPollingAdapter.reprocessDlq(limit?)` remains available for callers that already use that adapter.
Provider stores expose the transport-agnostic `reprocess()` method through `DeadLetterStorePort`.

## Runtime Permissions

Grant the permissions required by the selected provider and DLQ store:

- Deno KV / KV polling DLQ: `--unstable-kv`; add `--allow-read` and `--allow-write` when opening a
  file-backed KV path.
- Remote KV Connect, Redis, PostgreSQL, and RabbitMQ: `--allow-net` for the backend endpoint.
- Auto-discovery from Aspire or environment variables: `--allow-env`.

RabbitMQ users can configure broker-side dead-letter exchanges for higher throughput or operational
policy, but the package-level guarantee is the configured `DeadLetterStorePort` sink.

### `TypedQueueOptions`

```ts
interface TypedQueueOptions extends QueueOptions {
  validateOnEnqueue?: boolean;
  validateOnDequeue?: boolean;
  onValidationError?: 'discard' | 'dlq' | 'throw';
}
```

## Architecture

The root module intentionally does not re-export provider adapters. That keeps common imports like
`createQueue()`, `MessageQueue`, and validation helpers usable without eagerly pulling
backend-specific dependencies into every consumer's module graph. Adapter and dead-letter store
classes are available from explicit subpaths.

The public factory stays synchronous. Redis and RabbitMQ adapters are resolved lazily on first
operational use, so existing consumers can keep treating `createQueue()` as a normal
constructor-style API.

## Docs

- [JSR package](https://jsr.io/@netscript/queue)
- [JSR docs](https://jsr.io/@netscript/queue/doc)
- [Fedify message queue runtime](https://fedify.dev/manual/runtime#message-queue)
- [Deno KV queue overview](https://docs.deno.com/deploy/kv/manual/queue_overview)
- `@netscript/cron`
- `@netscript/telemetry`

## License

MIT
