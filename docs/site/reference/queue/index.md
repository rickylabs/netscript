---
layout: layouts/base.vto
title: "@netscript/queue"
---

# `@netscript/queue`

Provider-agnostic message queue abstraction for NetScript applications. It wraps
[Fedify](https://fedify.dev/) battle-tested queue adapters behind a single, unified
`MessageQueue` interface with optional Zod validation and Aspire-based backend
auto-discovery. This page is generated from the package public surface with `deno doc`
(US-2). For the full index of packages and plugins return to the
[reference overview](/reference/).

The root entrypoint (`@netscript/queue`) re-exports the factory functions, the port
contracts (`./ports`), the error hierarchy (`./errors`), and the validation helpers
(`./validation`). The remaining sub-path exports carry the concrete provider adapters and a
test double:

- [`@netscript/queue/ports`](#sub-path-exports) — the core interfaces and enums.
- [`@netscript/queue/errors`](#sub-path-exports) — the queue error classes and codes.
- [`@netscript/queue/validation`](#sub-path-exports) — Zod validation helpers.
- [`@netscript/queue/adapters/deno-kv`](#sub-path-exports) — Deno KV adapter.
- [`@netscript/queue/adapters/redis`](#sub-path-exports) — Redis adapter.
- [`@netscript/queue/adapters/amqp`](#sub-path-exports) — RabbitMQ (AMQP) adapter.
- [`@netscript/queue/adapters/kv-polling`](#sub-path-exports) — KV-polling adapter for KV Connect.
- [`@netscript/queue/testing`](#sub-path-exports) — in-memory adapter for tests.

## Factory functions

| Symbol | Signature | Description |
| --- | --- | --- |
| `createQueue` | `function createQueue<T = unknown>(name: string, options?: QueueOptions): MessageQueue<T>` | Create a message queue instance with auto-discovery (RabbitMQ, then Redis, then Deno KV). |
| `createTypedQueue` | `function createTypedQueue<T>(name: string, schema: ValidationSchema<T>, options?: TypedQueueOptions): TypedMessageQueue<T>` | Create a type-safe message queue with Zod validation at enqueue and dequeue time. |
| `createParallelQueue` | `function createParallelQueue<T = unknown>(name: string, options?: ParallelQueueOptions): MessageQueue<T>` | Create a queue with concurrent processing via Fedify ParallelMessageQueue. |

## Port contracts

Exported from the root and from [`@netscript/queue/ports`](#sub-path-exports).

| Symbol | Kind | Description |
| --- | --- | --- |
| `MessageQueue` | interface | Core message queue interface that all adapters implement (`enqueue`, `listen`). |
| `TypedMessageQueue` | interface | `MessageQueue` extended with runtime schema validation. |
| `MessageContext` | interface | Metadata and acknowledgment controls passed to handlers during processing. |
| `EnqueueOptions` | interface | Options for enqueueing messages (for example, delay). |
| `ListenOptions` | interface | Options for listening to messages. |
| `QueueOptions` | interface | Base options for creating a queue. |
| `TypedQueueOptions` | interface | Options for a typed queue with Zod validation. |
| `ParallelQueueOptions` | interface | Options for a parallel queue (concurrency). |
| `QueueConnectionOptions` | interface | Provider-specific connection options. |
| `QueueProvider` | enum | Supported queue providers (Deno KV, Redis, RabbitMQ). |

## Errors

Exported from the root and from [`@netscript/queue/errors`](#sub-path-exports).

| Symbol | Kind | Description |
| --- | --- | --- |
| `QueueError` | class | Base error class for all queue operations. |
| `QueueConnectionError` | class | Thrown when a queue connection fails. |
| `QueueConfigurationError` | class | Thrown when queue configuration is invalid. |
| `QueueHandlerError` | class | Thrown when a message handler fails. |
| `QueueValidationError` | class | Thrown when message validation fails. |
| `QueueErrorCode` | enum | Error codes for queue operations. |

## Validation

Exported from the root and from [`@netscript/queue/validation`](#sub-path-exports).

| Symbol | Signature | Description |
| --- | --- | --- |
| `safeValidate` | `function safeValidate<T>(schema: ValidationSchema<T>, message: unknown): ValidationResult<T>` | Validate a message against a schema, returning a result object instead of throwing. |
| `validateOrThrow` | `function validateOrThrow<T>(schema: ValidationSchema<T>, message: unknown, context?: Record): T` | Validate a message and throw `QueueValidationError` if invalid. |
| `withValidation` | `function withValidation<T>(schema: ValidationSchema<T>, handler)` | Wrap a handler so messages are validated before it runs. |
| `ValidationSchema` | interface | Minimal schema contract supported by the validation helpers. |
| `ValidationResult` | interface | Result type returned by `safeValidate`. |

## Adapters

Each provider adapter is published under its own sub-path and implements the
`MessageQueue` contract directly. Most applications use `createQueue` and never import an
adapter explicitly.

| Symbol | Kind | Entrypoint | Description |
| --- | --- | --- | --- |
| `DenoKvAdapter` | class | `@netscript/queue/adapters/deno-kv` | Deno KV queue adapter (default backend). |
| `DenoKvAdapterOptions` | interface | `@netscript/queue/adapters/deno-kv` | Options for `DenoKvAdapter`. |
| `RedisAdapter` | class | `@netscript/queue/adapters/redis` | Redis queue adapter. |
| `AmqpAdapter` | class | `@netscript/queue/adapters/amqp` | AMQP (RabbitMQ) queue adapter. |
| `KvPollingAdapter` | class | `@netscript/queue/adapters/kv-polling` | KV-polling adapter for remote KV Connect (HTTP) backends. |
| `KvPollingAdapterOptions` | interface | `@netscript/queue/adapters/kv-polling` | Options for `KvPollingAdapter`. |

The `kv-polling` adapter additionally re-exports the portable KV store contracts from
[`@netscript/kv`](/reference/): `KvStore`, `WatchableKv`, `KvEntry`, `KvKey`,
`AtomicMutation`, `AtomicCheck`, `AtomicResult`, `WatchEvent`, and their option interfaces
(`KvListOptions`, `KvSetOptions`, `WatchOptions`, `WatchPrefixOptions`), so KV-Connect
consumers can type their backing store without a second import.

## Testing

Exported from [`@netscript/queue/testing`](#sub-path-exports).

| Symbol | Kind | Description |
| --- | --- | --- |
| `MemoryQueueAdapter` | class | In-memory `MessageQueue` implementation for port-contract tests. |
| `MemoryQueueAdapterOptions` | interface | Options for `MemoryQueueAdapter`. |

## Sub-path exports

The following entrypoints are published alongside the root export. Their symbols are
documented in the sections above.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/queue` | `./mod.ts` | Factories plus re-exported ports, errors, and validation. |
| `@netscript/queue/ports` | `./ports/mod.ts` | Core interfaces and enums. |
| `@netscript/queue/errors` | `./ports/errors.ts` | Error classes and codes. |
| `@netscript/queue/validation` | `./validation/mod.ts` | Zod validation helpers. |
| `@netscript/queue/testing` | `./testing/mod.ts` | In-memory adapter for tests. |
| `@netscript/queue/adapters/deno-kv` | `./adapters/deno-kv.adapter.ts` | Deno KV adapter. |
| `@netscript/queue/adapters/redis` | `./adapters/redis.adapter.ts` | Redis adapter. |
| `@netscript/queue/adapters/amqp` | `./adapters/amqp.adapter.ts` | RabbitMQ (AMQP) adapter. |
| `@netscript/queue/adapters/kv-polling` | `./adapters/kv-polling.adapter.ts` | KV-polling adapter for KV Connect. |

---

Back to the [reference overview](/reference/).
