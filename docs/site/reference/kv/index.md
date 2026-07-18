---
layout: layouts/base.vto
title: "@netscript/kv"
---

# `@netscript/kv`

Reactive key-value storage with a unified API across Deno KV, Redis, and in-memory
backends. This page is generated from the package's public surface with `deno doc`
(US-2). For the full index of packages and plugins return to the
[reference overview](/reference/).

The root entrypoint (`@netscript/kv`) exposes the stable shared lifecycle API, the
portable KV types, and the lightweight Deno KV and in-memory adapters. Three sub-path
exports carry the heavier integrations:

- [`@netscript/kv/redis`](#sub-path-exports) — the Redis-backed adapter (self-registers
  the `'redis'` provider on import).
- [`@netscript/kv/kvdex`](#sub-path-exports) — the [kvdex](https://jsr.io/@olli/kvdex)
  bridge factory and re-exported kvdex core APIs.
- [`@netscript/kv/testing`](#sub-path-exports) — the shared KV port contract harness for
  adapter authors.

## Shared lifecycle

The shared singleton resolves a provider once (auto-detecting from the environment) and
hands back a `WatchableKv` for the rest of the process.

| Symbol | Signature | Description |
| --- | --- | --- |
| `getKv` | `function getKv(config?: SharedKvConfig): Promise<WatchableKv>` | Resolve the shared `WatchableKv` singleton, initializing on first access. |
| `getRawKv` | `async function getRawKv(config?: SharedKvConfig): Promise<Deno.Kv>` | Resolve the raw `Deno.Kv` instance when the shared provider is Deno KV. |
| `getActiveProvider` | `function getActiveProvider(): KvProvider \| null` | Return the currently active provider, or `null` before initialization. |
| `getKvPath` | `function getKvPath(): string \| undefined` | Return the Deno KV path currently in use, or the discovered default. |
| `getRedisConnectionFromEnv` | `function getRedisConnectionFromEnv(): string \| undefined` | Read a normalized Redis connection string from the environment. |
| `isKvInitialized` | `function isKvInitialized(): boolean` | Check whether the shared adapter has been initialized. |
| `isWatchable` | `function isWatchable(store: KvStore): store is WatchableKv` | Type guard for stores that implement the `WatchableKv` contract. |
| `resetKv` | `async function resetKv(): Promise<void>` | Reset the shared state for tests or isolated validation runs. |
| `closeKv` | `async function closeKv(): Promise<void>` | Close and clear the shared adapter state. |

## Adapters

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `DenoKvAdapter` | class | `class DenoKvAdapter implements WatchableKv` | Deno-native adapter backed by `Deno.Kv`, with native watch support. |
| `MemoryKvAdapter` | class | `class MemoryKvAdapter implements WatchableKv` | Volatile adapter that keeps all data in process memory. |

## Store contracts

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `KvStore` | interface | `interface KvStore extends AsyncDisposable` | Base key-value storage contract (`get`/`set`/`delete`/`has`/`list`/`atomic`/`close`). |
| `WatchableKv` | interface | `interface WatchableKv extends KvStore` | Extends `KvStore` with reactive `watch` and `watchPrefix` capabilities. |
| `SharedKvConfig` | interface | `interface SharedKvConfig` | Options for configuring the shared KV instance. |

## Keys, entries, and options

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `KvKey` | type alias | `type KvKey = readonly Deno.KvKeyPart[]` | Portable key format shared by all adapters. |
| `KvEntry` | interface | `interface KvEntry<T>` | Key-value entry returned from `get()` and `list()`. |
| `KvSetOptions` | interface | `interface KvSetOptions` | Options for `KvStore.set()` (for example `expireIn`). |
| `KvListOptions` | interface | `interface KvListOptions` | Selector and pagination options for `KvStore.list()`. |
| `KvProvider` | type alias | `type KvProvider = 'redis' \| 'deno-kv' \| 'nitro' \| 'auto'` | Providers supported by the shared KV lifecycle helpers. |

## Atomic operations

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `AtomicCheck` | interface | `interface AtomicCheck` | Versionstamp check used by atomic compare-and-swap operations. |
| `AtomicMutation` | type alias | `type AtomicMutation = { type: 'set'; key: KvKey; value: unknown; expireIn?: number } \| { type: 'delete'; key: KvKey } \| { type: 'sum' \| 'min' \| 'max'; key: KvKey; value: bigint }` | Mutation operations accepted by `KvStore.atomic()`. |
| `AtomicResult` | interface | `interface AtomicResult` | Result returned from an atomic operation. |

## Watch events

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `WatchEvent` | interface | `interface WatchEvent<T>` | Event emitted when an observed key changes. |
| `WatchOptions` | interface | `interface WatchOptions` | Options for `WatchableKv.watch()`. |
| `WatchPrefixOptions` | interface | `interface WatchPrefixOptions extends WatchOptions` | Options for `WatchableKv.watchPrefix()`. |

## Sub-path exports

The following entrypoints are published alongside the root export. Each is generated from
its own `deno doc` surface.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/kv` | `./mod.ts` | Shared lifecycle, adapters, and types (documented above). |
| `@netscript/kv/redis` | `./redis.ts` | Redis adapter (documented below). |
| `@netscript/kv/kvdex` | `./kvdex.ts` | kvdex bridge factory + re-exported kvdex core (documented below). |
| `@netscript/kv/testing` | `./src/testing/mod.ts` | Shared KV port contract harness (documented below). |

### `@netscript/kv/redis`

Importing this module re-exports the Redis adapter **and** self-registers the `'redis'`
provider factory with the shared lifecycle. It also re-exports the shared store contracts
(`KvStore`, `WatchableKv`, `KvKey`, `KvEntry`, `KvListOptions`, `KvSetOptions`,
`AtomicCheck`, `AtomicMutation`, `AtomicResult`, `WatchEvent`, `WatchOptions`,
`WatchPrefixOptions`).

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `RedisKvAdapter` | class | `class RedisKvAdapter implements WatchableKv` | Distributed Redis adapter for `@netscript/kv`. |
| `RedisKvOptions` | interface | `interface RedisKvOptions` | Redis connection options for the adapter. |

### `@netscript/kv/kvdex`

The kvdex bridge factory plus a curated re-export of the [kvdex](https://jsr.io/@olli/kvdex)
core APIs and Deno-KV-compatible types.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `createNetscriptDb` | function | `async function createNetscriptDb<T>(schema: T, options?: CreateNetscriptDbOptions): Promise<ReturnType<kvdex>>` | Create a kvdex database backed by the active `@netscript/kv` provider. |
| `CreateNetscriptDbOptions` | interface | `interface CreateNetscriptDbOptions` | Options for `createNetscriptDb`. |
| `WatchableKvBridge` | class | `class WatchableKvBridge` | Adapts a `WatchableKv` to the `DenoKv` interface kvdex expects. |
| `KvdexSchema` | type alias | `type KvdexSchema = Record<string, any>` | Accepted schema shape, structurally compatible with kvdex's `SchemaDefinition`. |
| `kvdex` | function | `function kvdex<TSchema>(options: KvdexOptions<TSchema>): Database<TSchema>` | Re-exported kvdex database factory. |
| `collection` | function | `function collection<TInput, TOutput, TOptions>(model, options?): BuilderFn` | Re-exported kvdex collection builder. |
| `model` | function | `function model<TOutput, TInput>(transform?): Model<TInput, TOutput>` | Re-exported kvdex model factory. |

This entrypoint also re-exports the kvdex Deno-KV compatibility types: `KvProvider`,
`KvObject`, `DenoAtomicCheck`, `DenoAtomicOperation`, `DenoKvCommitError`,
`DenoKvCommitResult`, `DenoKvEnqueueOptions`, `DenoKvEntryMaybe`, `DenoKvGetOptions`,
`DenoKvKeyPart`, `DenoKvListIterator`, `DenoKvListOptions`, `DenoKvListSelector`,
`DenoKvSetOptions`, `DenoKvStrictKey`, and `DenoKvWatchOptions`.

### `@netscript/kv/testing`

A reusable contract harness for adapter authors. Re-exports the shared `KvStore` and
`WatchableKv` contracts alongside the test helpers.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `runKvStoreContract` | function | `function runKvStoreContract(options: KvStoreContractOptions): void` | Register the canonical KV store contract tests against an adapter. |
| `KvStoreContractOptions` | interface | `interface KvStoreContractOptions` | Options for `runKvStoreContract`. |
| `createMemoryKvAdapter` | function | `function createMemoryKvAdapter(): MemoryKvAdapter` | Factory for a clean in-memory KV adapter for downstream tests. |
| `MemoryKvAdapter` | class | `class MemoryKvAdapter implements WatchableKv` | Volatile in-memory adapter (re-exported from the root). |

## See it live

- **How-to:** [Queue / KV / cron](/data-persistence/how-to/queue-kv-cron/) — read, write, and watch a KV store with
  these symbols in a running workspace.
- **Concept:** [KV, queues & cron](/data-persistence/kv-queues-cron/) — the durable-by-default KV
  model and how it backs queues and cron.

---

Back to the [reference overview](/reference/).
