---
layout: layouts/base.vto
title: "@netscript/kv"
---

# `@netscript/kv`

Key-value storage with one API across Deno KV, Redis and in-memory backends, including atomic
commits and watch streams. Use it for process-wide KV state that must run unchanged on Deno KV
locally and Redis in production.

## Sub-path exports

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/kv` | `./mod.ts` | [Shared lifecycle](#shared-lifecycle), [adapters](#adapters) for Deno KV and memory, and the portable KV types. |
| `@netscript/kv/redis` | `./redis.ts` | [Redis adapter](#netscriptkvredis); registers the `'redis'` provider on import. |
| `@netscript/kv/kvdex` | `./kvdex.ts` | [kvdex bridge factory](#netscriptkvkvdex) and re-exported [kvdex](https://jsr.io/@olli/kvdex) core APIs. |
| `@netscript/kv/testing` | `./src/testing/mod.ts` | [Shared KV port contract harness](#netscriptkvtesting) for adapter authors. |

## Shared lifecycle

The shared singleton resolves a provider once, detecting it from the environment, and returns a
`WatchableKv` for the rest of the process.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `getKv` | function | `function getKv(config?: SharedKvConfig): Promise<WatchableKv>` | Resolve the shared `WatchableKv` singleton, initializing on first access. |
| `getRawKv` | function | `async function getRawKv(config?: SharedKvConfig): Promise<Deno.Kv>` | Resolve the raw `Deno.Kv` instance when the shared provider is Deno KV. |
| `getActiveProvider` | function | `function getActiveProvider(): KvProvider \| null` | Return the currently active provider, or `null` before initialization. |
| `getKvPath` | function | `function getKvPath(): string \| undefined` | Return the Deno KV path currently in use, or the discovered default. |
| `getRedisConnectionFromEnv` | function | `function getRedisConnectionFromEnv(): string \| undefined` | Read a normalized Redis connection string from the environment. |
| `isKvInitialized` | function | `function isKvInitialized(): boolean` | Check whether the shared adapter has been initialized. |
| `isWatchable` | function | `function isWatchable(store: KvStore): store is WatchableKv` | Type guard for stores that implement the `WatchableKv` contract. |
| `resetKv` | function | `async function resetKv(): Promise<void>` | Reset the shared state for tests or isolated validation runs. |
| `closeKv` | function | `async function closeKv(): Promise<void>` | Close and clear the shared adapter state. |

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

### Current state followed by changes

Call `watch(keys, { initial: true })` to subscribe before receiving current state. The first batch
contains every watched key, including absent keys as `delete`/null events, and marks its events with
`initial: true`. Subsequent batches contain changes. A write committed after subscription
acknowledgement cannot fall into a startup load/subscribe gap; a write racing the snapshot may
appear twice, so dedupe by equal versionstamp. Redis writers stamp independently: never use their
versionstamps to order writes across processes. Deno KV still coalesces native watch updates.
Without `initial`, each backend keeps its native behavior.

The kvdex bridge applies the snapshot directly, suppresses equal-stamp changes, and re-reads each
change batch's distinct affected keys using a batch read when available. Frames reflect stored
state, not event payload or stamp order; unchanged state produces no frame.

First-party handles provide an optional `ready` promise. Start iteration before awaiting it;
subscriptions are lazy. Redis resolves it on SUBSCRIBE acknowledgement, memory on listener
registration, and Deno KV on the first native frame. Startup failure or abort before readiness
rejects the promise. Third-party adapters may return an iterable without `ready`. Prefix watches
retain their existing `skipInitial` and discovery semantics. `createLazyKv` uses the first delivered
batch as readiness when its inner adapter has no promise. A readiness rejection alone does not make
iteration throw; iteration retains the inner adapter's completion or error behavior.

## `@netscript/kv/redis`

Importing this module registers the `'redis'` provider factory with the shared lifecycle. It also
re-exports the Redis adapter and the shared store contracts
(`KvStore`, `WatchableKv`, `KvKey`, `KvEntry`, `KvListOptions`, `KvSetOptions`,
`AtomicCheck`, `AtomicMutation`, `AtomicResult`, `WatchEvent`, `WatchOptions`,
`WatchPrefixOptions`).

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `RedisKvAdapter` | class | `class RedisKvAdapter implements WatchableKv` | Distributed Redis adapter for `@netscript/kv`. |
| `RedisKvOptions` | interface | `interface RedisKvOptions` | Redis connection options for the adapter. |

## `@netscript/kv/kvdex`

The kvdex bridge factory, a curated re-export of the [kvdex](https://jsr.io/@olli/kvdex) core APIs,
and Deno-KV-compatible types.

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

## `@netscript/kv/testing`

A contract harness for adapter authors. It re-exports the shared `KvStore` and `WatchableKv`
contracts alongside the test helpers. The memory and Redis adapters run both contracts.

| Contract | Requires |
| --- | --- |
| `runKvStoreContract` | CRUD, listing, and value fidelity: plain-JSON values, including objects shaped like encoding markers, read back unchanged. |
| `runAtomicKvStoreContract` | Opt-in, because `atomic()` is optional on `KvStore`. One commit writes a single versionstamp to every mutated entry and returns it, so a compare-and-set on the returned versionstamp succeeds; `sum`/`min`/`max` combine with the stored value; concurrent commits are serializable; `bigint` values round-trip at any depth. |
| `runWatchableKvContract` | Watch events carry the versionstamp of the write that produced them and deliver values unchanged; a change received while the consumer is between batches is delivered on the next request without waiting for a later write; `debounce` never drops a queued change; aborting ends the stream promptly, even inside a debounce window. |

Default watch scenarios always run, including on adapters without optional readiness or snapshots.
The harness uses `ready` when exposed and keeps a startup allowance otherwise. Declare
snapshot support with harness `initial: true` to add snapshot delivery scenarios.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `runKvStoreContract` | function | `function runKvStoreContract(options: KvStoreContractOptions): void` | Register the canonical KV store contract tests (CRUD, listing, value fidelity) against an adapter. |
| `KvStoreContractOptions` | interface | `interface KvStoreContractOptions` | Options for `runKvStoreContract` and `runAtomicKvStoreContract`. |
| `runAtomicKvStoreContract` | function | `function runAtomicKvStoreContract(options: KvStoreContractOptions): void` | Register the Deno KV `atomic()` parity tests for an adapter that implements the optional `atomic()`. |
| `runWatchableKvContract` | function | `function runWatchableKvContract(options: WatchableKvContractOptions): void` | Register the canonical `watch()` contract tests against a `WatchableKv` adapter. |
| `WatchableKvContractOptions` | interface | `interface WatchableKvContractOptions` | Options for `runWatchableKvContract`. |
| `createMemoryKvAdapter` | function | `function createMemoryKvAdapter(): MemoryKvAdapter` | Factory for a clean in-memory KV adapter for downstream tests. |
| `MemoryKvAdapter` | class | `class MemoryKvAdapter implements WatchableKv` | Volatile in-memory adapter (re-exported from the root). |

## Related pages

- [Use KV, queues, and cron](/data-persistence/how-to/queue-kv-cron/): read, write, and watch a KV store in
  a running workspace.
- [KV, queues & cron](/data-persistence/kv-queues-cron/): the durable-by-default KV model and how it
  backs queues and cron.
