# @netscript/kv - Key-Value Store Package

> Provider-agnostic KV store abstraction with reactive watch support for event-driven systems

## Overview

This package provides a unified interface for key-value storage operations across Deno KV, Redis,
and in-memory backends, with a crucial extension: **reactive watch capabilities** that enable
real-time event-driven architectures.

## Relationship with @netscript/queue Package

### The Key Distinction

| Package              | Purpose                               | Operations                                         |
| -------------------- | ------------------------------------- | -------------------------------------------------- |
| **@netscript/kv**    | Key-value storage + reactive watching | get, set, delete, list, **watch**, **watchPrefix** |
| **@netscript/queue** | Message queue delivery + retries      | enqueue, listen, ack, nack                         |

**They share the same underlying connections but serve different purposes:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION                                     │
│                                                                             │
│   @netscript/kv usage:                          @netscript/queue usage:                         │
│   ─────────────                       ─────────────                         │
│   kv.set(['executions', id], data)    queue.enqueue(jobMessage)             │
│   kv.watchPrefix(['executions'])      queue.listen(handler)                 │
│   kv.watch([['jobs', id]])            // react to changes                    │
│                                                                             │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │ SHARED CONNECTION
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Deno.Kv Instance                                │
│                                                                             │
│   ┌─────────────────────────────┐   ┌─────────────────────────────────┐    │
│   │  Key-Value Storage          │   │  Native Queue (Deno.Kv.enqueue) │    │
│   │  ['executions', ...]        │   │  Fedify's DenoKvMessageQueue    │    │
│   │  ['jobs', ...]              │   │                                 │    │
│   │  ['events', ...]            │   │                                 │    │
│   │                             │   │                                 │    │
│   │  kv.set() / kv.get()        │   │  kv.enqueue() / kv.listenQueue()│    │
│   │  kv.watch()                 │   │                                 │    │
│   └─────────────────────────────┘   └─────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### How They Integrate

**@netscript/queue keeps its Fedify-based adapters unchanged.** We don't replace them, we complement
them:

```typescript
// @netscript/queue's DenoKvAdapter (EXISTING - wraps Fedify)
import { DenoKvMessageQueue } from '@fedify/denokv';

export class DenoKvAdapter<T> implements MessageQueue<T> {
  constructor(queueName: string, options?: { useShared?: boolean }) {
    // NEW: Use shared KV instance from @netscript/kv package
    if (options?.useShared !== false) {
      this.kv = await getRawKv(); // From @netscript/kv package
    }
    this.queue = new DenoKvMessageQueue(this.kv);
  }
}
```

**@netscript/kv provides additional capabilities Fedify doesn't have:**

- `watch()` - Observe key changes
- `watchPrefix()` - Observe all changes under a prefix
- Shared instance management

---

## Why a Separate Package?

### Problem Statement

The current implementation has several issues:

1. **Scattered KV Usage**: KV instances are created ad-hoc in queue adapters, workers, and frontends
2. **No Watch Abstraction**: `Deno.Kv.watch()` is used directly, making code non-portable
3. **Sentinel Anti-Pattern**: Using `['executions-updated']` keys as change markers instead of
   proper subscriptions
4. **Duplicate Connections**: Multiple KV connections opened when one shared instance would suffice

### Current Broken Pattern (Sentinel)

```typescript
// ❌ ANTI-PATTERN: Watching a "marker" key
const watcher = kv.watch([
  ['executions-updated'], // Sentinel key
  ['running-tasks-updated'], // Sentinel key
]);

for await (const entries of watcher) {
  // When sentinel changes, refetch ALL data
  const allExecutions = await fetchRecentExecutions(20);
  sendSSE('executions', allExecutions);
}
```

### New Pattern (Direct Watch)

```typescript
// ✅ CORRECT: Watch actual data
import { getKv } from '@netscript/kv';

const kv = await getKv();

for await (const event of kv.watchPrefix(['executions'])) {
  // Get granular per-key changes
  sendSSE('execution-update', {
    type: event.type, // 'set' or 'delete'
    jobId: event.key[1],
    executionId: event.key[2],
    execution: event.value, // The actual data!
  });
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            APPLICATION LAYER                                 │
│                                                                             │
│   import { getKv, watchPrefix, subscribe, publish } from '@netscript/kv';             │
│                                                                             │
│   const kv = await getKv();                                                 │
│   for await (const change of kv.watchPrefix(['jobs'])) { ... }              │
│   await kv.publish('job-triggers', { jobId: 'export' });                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              @netscript/kv PACKAGE                                     │
│                                                                             │
│  ┌────────────────────┐  ┌────────────────────┐  ┌─────────────────────┐   │
│  │   KvStore          │  │   WatchableKv      │  │   SharedInstance    │   │
│  │   Interface        │  │   Interface        │  │   Manager           │   │
│  │                    │  │                    │  │                     │   │
│  │  • get(key)        │  │  • watch(keys)     │  │  • getKv()          │   │
│  │  • set(key, val)   │  │  • watchPrefix()   │  │  • getRawKv()       │   │
│  │  • delete(key)     │  │  • subscribe()     │  │  • closeKv()        │   │
│  │  • list(prefix)    │  │  • publish()       │  │                     │   │
│  └────────────────────┘  └────────────────────┘  └─────────────────────┘   │
│                                      │                                      │
│  ┌───────────────────────────────────┴───────────────────────────────────┐ │
│  │                           ADAPTERS                                     │ │
│  │                                                                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │ │
│  │  │  DenoKv      │  │  Redis       │  │  PostgreSQL  │  │  Memory   │ │ │
│  │  │  Adapter     │  │  Adapter     │  │  Adapter     │  │  Adapter  │ │ │
│  │  │              │  │              │  │              │  │           │ │ │
│  │  │ Deno.Kv      │  │ ioredis      │  │ postgres     │  │ Map +     │ │ │
│  │  │ .watch()     │  │ pub/sub      │  │ LISTEN/      │  │ Events    │ │ │
│  │  │              │  │ keyspace     │  │ NOTIFY       │  │           │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └───────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ getRawKv() for @netscript/queue
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              @netscript/queue PACKAGE                                  │
│                                                                             │
│  Uses Fedify adapters (DenoKvMessageQueue, RedisMessageQueue, etc.)         │
│  Gets raw KV instance from @netscript/kv.getRawKv() for connection sharing            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### Types

```typescript
// interfaces/types.ts

/**
 * KV key - array of strings (compatible with Deno.Kv and Fedify)
 */
export type KvKey = readonly string[];

/**
 * KV entry returned from list/get operations
 */
export interface KvEntry<T> {
  key: KvKey;
  value: T;
  versionstamp?: string;
}

/**
 * Watch event emitted when a key changes
 */
export interface WatchEvent<T> {
  key: KvKey;
  value: T | null;
  previousValue?: T | null;
  type: 'set' | 'delete';
  timestamp: Date;
  versionstamp?: string;
}

/**
 * Subscription handle for pub/sub
 */
export interface Subscription {
  unsubscribe(): Promise<void>;
  readonly channel: string;
  readonly isActive: boolean;
}
```

### KvStore Interface (Base)

```typescript
// interfaces/kv-store.ts

/**
 * Base KV store interface - compatible with Fedify's KvStore
 */
export interface KvStore {
  /**
   * Get a value by key
   */
  get<T = unknown>(key: KvKey): Promise<T | undefined>;

  /**
   * Set a value with optional TTL
   */
  set(key: KvKey, value: unknown, options?: KvSetOptions): Promise<void>;

  /**
   * Delete a key
   */
  delete(key: KvKey): Promise<void>;

  /**
   * List entries by prefix
   */
  list<T = unknown>(options: KvListOptions): AsyncIterable<KvEntry<T>>;

  /**
   * Atomic compare-and-swap operation (optional)
   */
  cas?(key: KvKey, expectedValue: unknown, newValue: unknown): Promise<boolean>;

  /**
   * Close the KV store connection
   */
  close(): Promise<void>;
}

export interface KvSetOptions {
  /** Time-to-live in milliseconds */
  ttl?: number;
}

export interface KvListOptions {
  /** Key prefix to filter by */
  prefix: KvKey;
  /** Maximum number of entries to return */
  limit?: number;
  /** Cursor for pagination */
  cursor?: string;
  /** Reverse order */
  reverse?: boolean;
}
```

### WatchableKv Interface (Extended)

```typescript
// interfaces/watchable-kv.ts

/**
 * Extended KV interface with reactive watch capabilities
 * This is what @netscript/kv provides beyond Fedify's KvStore
 */
export interface WatchableKv extends KvStore {
  /**
   * Watch specific keys for changes.
   * Returns an async iterator that yields on every change.
   */
  watch<T = unknown>(
    keys: KvKey[],
    options?: WatchOptions,
  ): AsyncIterable<WatchEvent<T>[]>;

  /**
   * Watch all keys under a prefix.
   * More powerful than watch() - captures new keys too.
   */
  watchPrefix<T = unknown>(
    prefix: KvKey,
    options?: WatchOptions,
  ): AsyncIterable<WatchEvent<T>>;

  /**
   * Subscribe to a channel (pub/sub pattern).
   * For backends that support native pub/sub (Redis, PostgreSQL).
   */
  subscribe<T = unknown>(
    channel: string,
    handler: (message: T) => void | Promise<void>,
  ): Promise<Subscription>;

  /**
   * Publish to a channel.
   */
  publish<T = unknown>(channel: string, message: T): Promise<void>;

  /**
   * Check if watch is supported by this backend.
   */
  readonly supportsWatch: boolean;

  /**
   * Check if native pub/sub is supported by this backend.
   */
  readonly supportsPubSub: boolean;
}

export interface WatchOptions {
  /** Abort signal for cleanup */
  signal?: AbortSignal;
  /** Debounce rapid changes (ms) */
  debounce?: number;
}
```

---

## Adapters

### Deno KV Adapter

Deno KV has native `watch()` support:

```typescript
// adapters/deno-kv.adapter.ts

export class DenoKvAdapter implements WatchableKv {
  readonly supportsWatch = true;
  readonly supportsPubSub = false; // Emulated via watch

  constructor(private kv: Deno.Kv) {}

  // Basic CRUD operations
  async get<T>(key: KvKey): Promise<T | undefined> {
    const result = await this.kv.get<T>(key);
    return result.value ?? undefined;
  }

  async set(key: KvKey, value: unknown, options?: KvSetOptions): Promise<void> {
    await this.kv.set(key, value, {
      expireIn: options?.ttl,
    });
  }

  async delete(key: KvKey): Promise<void> {
    await this.kv.delete(key);
  }

  async *list<T>(options: KvListOptions): AsyncIterable<KvEntry<T>> {
    const entries = this.kv.list<T>({
      prefix: options.prefix,
      limit: options.limit,
      reverse: options.reverse,
    });

    for await (const entry of entries) {
      yield {
        key: entry.key as KvKey,
        value: entry.value,
        versionstamp: entry.versionstamp,
      };
    }
  }

  // Watch capabilities (Deno.Kv native!)
  async *watch<T>(keys: KvKey[], options?: WatchOptions): AsyncIterable<WatchEvent<T>[]> {
    const stream = this.kv.watch(keys);

    try {
      for await (const entries of stream) {
        if (options?.signal?.aborted) break;

        yield entries.map((entry, i) => ({
          key: keys[i],
          value: entry.value as T | null,
          type: entry.value === null ? 'delete' : 'set',
          timestamp: new Date(),
          versionstamp: entry.versionstamp ?? undefined,
        }));
      }
    } finally {
      // Cleanup if needed
    }
  }

  async *watchPrefix<T>(prefix: KvKey, options?: WatchPrefixOptions): AsyncIterable<WatchEvent<T>> {
    // Deno KV watch doesn't support prefix watching natively
    // Implementation: poll for new keys + watch known keys
    //
    // Options:
    //   - pollInterval: how often to scan for new keys (default: 1000ms)
    //   - skipInitial: if true, don't emit existing keys on connection (default: false)
    //     This is critical for SSE connections to avoid flooding clients with
    //     all existing records when they connect.

    let knownKeys = new Map<string, KvKey>();
    const keyToString = (k: KvKey) => JSON.stringify(k);

    // Initial scan
    for await (const entry of this.list<T>({ prefix })) {
      knownKeys.set(keyToString(entry.key), entry.key);
    }

    // Emit initial state (unless skipInitial is true)
    if (!options?.skipInitial) {
      // ... emit initial entries
    }

    // Start watching known keys and polling for new ones
    const pollInterval = 1000; // 1 second
    let lastPoll = Date.now();

    const keysArray = () => Array.from(knownKeys.values());

    for await (const events of this.watch<T>(keysArray(), options)) {
      for (const event of events) {
        yield event;
      }

      // Periodically check for new keys
      if (Date.now() - lastPoll > pollInterval) {
        for await (const entry of this.list<T>({ prefix })) {
          const keyStr = keyToString(entry.key);
          if (!knownKeys.has(keyStr)) {
            knownKeys.set(keyStr, entry.key);
            yield {
              key: entry.key,
              value: entry.value,
              type: 'set',
              timestamp: new Date(),
            };
          }
        }
        lastPoll = Date.now();
      }
    }
  }

  // Pub/Sub emulated via KV watch
  async subscribe<T>(
    channel: string,
    handler: (message: T) => void | Promise<void>,
  ): Promise<Subscription> {
    const channelKey: KvKey = ['__pubsub', 'channels', channel];
    let active = true;

    const watchLoop = async () => {
      for await (const [event] of this.watch<{ message: T; timestamp: number }>([channelKey])) {
        if (!active) break;
        if (event.value === null) continue;
        await handler(event.value.message);
      }
    };

    // Start watching in background
    const loopPromise = watchLoop();

    return {
      channel,
      get isActive() {
        return active;
      },
      async unsubscribe() {
        active = false;
        // Loop will exit on next iteration
      },
    };
  }

  async publish<T>(channel: string, message: T): Promise<void> {
    const channelKey: KvKey = ['__pubsub', 'channels', channel];
    await this.kv.set(channelKey, {
      message,
      timestamp: Date.now(),
    });
  }

  async close(): Promise<void> {
    this.kv.close();
  }
}
```

### Redis Adapter

```typescript
// adapters/redis.adapter.ts

export class RedisKvAdapter implements WatchableKv {
  readonly supportsWatch = true; // Via keyspace notifications
  readonly supportsPubSub = true; // Native Redis pub/sub

  constructor(
    private client: Redis,
    private subscriber: Redis, // Separate connection for subscriptions
  ) {}

  // ... CRUD operations using Redis commands ...

  async subscribe<T>(
    channel: string,
    handler: (message: T) => void | Promise<void>,
  ): Promise<Subscription> {
    // Native Redis SUBSCRIBE
    await this.subscriber.subscribe(channel);

    const messageHandler = async (ch: string, message: string) => {
      if (ch === channel) {
        await handler(JSON.parse(message) as T);
      }
    };

    this.subscriber.on('message', messageHandler);

    return {
      channel,
      isActive: true,
      async unsubscribe() {
        await this.subscriber.unsubscribe(channel);
        this.subscriber.off('message', messageHandler);
      },
    };
  }

  async publish<T>(channel: string, message: T): Promise<void> {
    await this.client.publish(channel, JSON.stringify(message));
  }
}
```

### Adapter Capabilities Matrix

| Adapter         | watch()         | watchPrefix()   | subscribe()     | publish()       | Notes         |
| --------------- | --------------- | --------------- | --------------- | --------------- | ------------- |
| DenoKvAdapter   | ✅ Native       | ✅ Poll+Watch   | ✅ Via watch    | ✅ Via KV       | Best for Deno |
| RedisAdapter    | ✅ Keyspace     | ✅ Pattern      | ✅ Native       | ✅ Native       | Best for prod |
| PostgresAdapter | ❌              | ❌              | ✅ LISTEN       | ✅ NOTIFY       | Pub/sub only  |
| MemoryAdapter   | ✅ EventEmitter | ✅ EventEmitter | ✅ EventEmitter | ✅ EventEmitter | Dev/test      |

---

## Shared Instance Management

```typescript
// core/shared-kv.ts

import { getKvConnection } from '@netscript/sdk';
import { DenoKvAdapter } from '../adapters/deno-kv.adapter.ts';
import type { WatchableKv } from '../interfaces/watchable-kv.ts';

let sharedInstance: WatchableKv | null = null;
let rawKvInstance: Deno.Kv | null = null;

/**
 * Get the shared WatchableKv instance.
 * Creates one if it doesn't exist.
 * Safe to call multiple times - returns same instance.
 */
export async function getKv(): Promise<WatchableKv> {
  if (sharedInstance) {
    return sharedInstance;
  }

  const kvPath = getKvConnection();
  rawKvInstance = kvPath ? await Deno.openKv(kvPath) : await Deno.openKv();
  sharedInstance = new DenoKvAdapter(rawKvInstance);

  return sharedInstance;
}

/**
 * Get the raw Deno.Kv instance.
 * Used by @netscript/queue package for Fedify's DenoKvMessageQueue.
 *
 * This is the KEY integration point with @netscript/queue!
 */
export async function getRawKv(): Promise<Deno.Kv> {
  if (!rawKvInstance) {
    await getKv(); // Initialize if needed
  }
  return rawKvInstance!;
}

/**
 * Close the shared KV instance.
 * Call this on application shutdown.
 */
export async function closeKv(): Promise<void> {
  if (sharedInstance) {
    await sharedInstance.close();
    sharedInstance = null;
    rawKvInstance = null;
  }
}
```

---

## Integration with @netscript/queue Package

The @netscript/queue package should be updated to use @netscript/kv's shared instance:

```typescript
// packages/queue/adapters/deno-kv.adapter.ts (UPDATED)

import { getRawKv } from '@netscript/kv'; // Import from @netscript/kv package
import { DenoKvMessageQueue } from '@fedify/denokv';

export interface DenoKvAdapterOptions {
  /** Use shared KV instance from @netscript/kv package (default: true) */
  useShared?: boolean;
  /** Provide your own Deno.Kv instance */
  instance?: Deno.Kv;
  /** Path to KV database (creates new instance) */
  path?: string;
}

export class DenoKvAdapter<T = unknown> implements MessageQueue<T> {
  private queue!: DenoKvMessageQueue;
  private kv!: Deno.Kv;
  private initialized = false;

  readonly nativeRetrial = true;

  constructor(
    private readonly queueName: string,
    private readonly options: DenoKvAdapterOptions = {},
  ) {}

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    if (this.options.instance) {
      // Use provided instance
      this.kv = this.options.instance;
    } else if (this.options.useShared !== false) {
      // Default: use shared instance from @netscript/kv
      this.kv = await getRawKv();
    } else if (this.options.path) {
      // Create new instance with path
      this.kv = await Deno.openKv(this.options.path);
    } else {
      // Fallback: use shared
      this.kv = await getRawKv();
    }

    // Wrap with Fedify's message queue (unchanged!)
    this.queue = new DenoKvMessageQueue(this.kv);
    this.initialized = true;
  }

  // ... rest of implementation unchanged ...
}
```

---

## Usage Examples

### Frontend: Real-time Job Monitoring

```typescript
// apps/frontend/routes/api/jobs.ts
import { getKv } from '@netscript/kv';

export const handler = define.handlers({
  async GET(_ctx) {
    const kv = await getKv();

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Watch job executions directly - no sentinel needed!
        for await (const event of kv.watchPrefix(['executions'])) {
          const data = JSON.stringify({
            type: event.type,
            jobId: event.key[1],
            executionId: event.key[2],
            execution: event.value,
            timestamp: event.timestamp.toISOString(),
          });

          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  },
});
```

### Worker: Record Execution (Triggers Watchers)

```typescript
// workers/worker/state.ts
import { getKv } from '@netscript/kv';
import type { ExecutionRecord } from '@contracts';

export class ExecutionState {
  private kv = getKv();

  async recordStart(execution: ExecutionRecord): Promise<void> {
    const kv = await this.kv;

    // This single set() triggers all watchers on ['executions'] prefix!
    await kv.set(['executions', execution.jobId, execution.id], execution);

    // Update current execution pointer
    await kv.set(['jobs', execution.jobId, 'current'], execution);
  }

  async recordComplete(
    executionId: string,
    jobId: string,
    updates: Partial<ExecutionRecord>,
  ): Promise<void> {
    const kv = await this.kv;
    const key = ['executions', jobId, executionId];
    const existing = await kv.get<ExecutionRecord>(key);

    if (existing) {
      const updated = { ...existing, ...updates };
      await kv.set(key, updated); // Triggers watchers!
      await kv.set(['jobs', jobId, 'last'], updated);
      await kv.delete(['jobs', jobId, 'current']);
    }
  }
}
```

### Frontend: Trigger Job via Pub/Sub

```typescript
// apps/frontend/routes/api/jobs/[id]/trigger.ts
import { getKv } from '@netscript/kv';
import type { JobTriggerEventV1 } from '@contracts';

export const handler = define.handlers({
  async POST(ctx) {
    const jobId = ctx.params.id;
    const body = await ctx.req.json();

    const kv = await getKv();

    // Publish trigger event - worker will pick it up
    await kv.publish<JobTriggerEventV1>('job-triggers', {
      jobId,
      payload: body.payload,
      requestedBy: 'manual',
      requestedAt: new Date().toISOString(),
    });

    return Response.json({
      message: 'Job trigger event published',
      jobId,
    });
  },
});
```

### Worker: Subscribe to Triggers

```typescript
// workers/events/bus.ts
import { getKv } from '@netscript/kv';
import { createTypedQueue } from '@netscript/queue';
import type { JobMessageV1, JobTriggerEventV1 } from '@contracts';

const jobQueue = createTypedQueue('jobs', JobMessageSchema);

export async function startEventBus(): Promise<void> {
  const kv = await getKv();

  await kv.subscribe<JobTriggerEventV1>('job-triggers', async (event) => {
    console.log(`📬 Received job trigger: ${event.jobId}`);

    await jobQueue.enqueue({
      jobId: event.jobId,
      triggeredBy: 'event',
      triggeredAt: new Date().toISOString(),
      payload: event.payload,
    });
  });
}
```

---

## Directory Structure

```
packages/kv/
├── ARCHITECTURE.md         # This document
├── README.md              # Quick start guide
├── deno.json              # Package configuration
├── mod.ts                 # Main exports
│
├── interfaces/
│   ├── mod.ts
│   ├── types.ts           # KvKey, WatchEvent, etc.
│   ├── kv-store.ts        # Base KvStore interface
│   └── watchable-kv.ts    # WatchableKv interface
│
├── adapters/
│   ├── mod.ts
│   ├── deno-kv.adapter.ts  # Deno.Kv implementation
│   ├── redis.adapter.ts    # Redis implementation
│   ├── postgres.adapter.ts # PostgreSQL implementation
│   └── memory.adapter.ts   # In-memory for testing
│
├── core/
│   ├── mod.ts
│   ├── shared-kv.ts       # getKv(), getRawKv(), closeKv()
│   └── factory.ts         # createKv() factory
│
└── utils/
    ├── mod.ts
    └── key-serialization.ts
```

---

## Key Benefits

| Benefit                 | Description                                                           |
| ----------------------- | --------------------------------------------------------------------- |
| **Unified Interface**   | Same API across Deno KV, Redis, PostgreSQL                            |
| **Reactive by Default** | Watch/subscribe built into the interface                              |
| **Shared Instance**     | Single KV connection reused across @netscript/kv and @netscript/queue |
| **No Sentinels**        | Direct key watching replaces sentinel pattern                         |
| **Queue Compatibility** | `getRawKv()` provides instance for @netscript/queue adapters          |
| **Event-Driven**        | Natural integration with worker/frontend events                       |
| **Backend Portable**    | Switch backends without code changes                                  |

---

## Summary

**@netscript/kv is complementary to @netscript/queue, not a replacement:**

- @netscript/kv = Storage + Watch + Pub/Sub
- @netscript/queue = Message Queue + Delivery + Retries

**They share the same connection** via `getRawKv()`, which @netscript/queue's DenoKvAdapter uses
internally.

**The key new capabilities from @netscript/kv:**

1. `watchPrefix()` - Real-time updates without sentinels
2. `subscribe()`/`publish()` - Pub/sub for job triggering
3. Shared instance management - One connection for everything
