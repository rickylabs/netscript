import {
  getKv,
  type KvEntry,
  type KvKey,
  type KvListOptions,
  type KvSetOptions,
  type WatchableKv,
} from '@netscript/kv';
import {
  KvJobRegistry,
  KvTaskRegistry,
  type RegistryKvStore,
} from '@netscript/plugin-workers-core/registry';
import { KvExecutionState } from '@netscript/plugin-workers-core/state';
import {
  KvWorkerIdempotencyStore,
  type WorkerIdempotencyKvStore,
} from '@netscript/plugin-workers-core/stores';
import type { WorkersServiceRuntime } from './routers/router-context.ts';

type WorkersKv = WatchableKv;

class LazyWorkersKvStore implements RegistryKvStore, WorkerIdempotencyKvStore {
  readonly #kv: Promise<WorkersKv>;

  constructor(kv: Promise<WorkersKv>) {
    this.#kv = kv;
  }

  async get<TValue = unknown>(key: readonly unknown[]): Promise<KvEntry<TValue> | null> {
    return await (await this.#kv).get<TValue>(toKvKey(key));
  }

  async set<TValue = unknown>(
    key: readonly unknown[],
    value: TValue,
    options?: KvSetOptions,
  ): Promise<void> {
    await (await this.#kv).set(toKvKey(key), value, options);
  }

  async delete(key: readonly unknown[]): Promise<void> {
    await (await this.#kv).delete(toKvKey(key));
  }

  async has(key: readonly unknown[]): Promise<boolean> {
    return await (await this.#kv).has(toKvKey(key));
  }

  async *list<TValue = unknown>(
    selector: { readonly prefix: readonly unknown[] } | KvListOptions,
  ): AsyncIterable<KvEntry<TValue>> {
    yield* (await this.#kv).list<TValue>({
      ...selector,
      prefix: toKvKey(selector.prefix),
    });
  }
}

function toKvKey(key: readonly unknown[]): KvKey {
  const parts: Deno.KvKeyPart[] = [];
  for (const part of key) {
    if (
      typeof part === 'string' || typeof part === 'number' || typeof part === 'bigint' ||
      typeof part === 'boolean'
    ) {
      parts.push(part);
      continue;
    }
    if (part instanceof Uint8Array) {
      parts.push(part);
      continue;
    }
    throw new TypeError(`Workers KV key contains unsupported part: ${String(part)}`);
  }
  return parts;
}

/** Create explicitly scoped runtime dependencies for the workers service. */
export function createWorkersServiceRuntime(): WorkersServiceRuntime {
  const kv = getKv();
  const store = new LazyWorkersKvStore(kv);
  return Object.freeze({
    executionState: new KvExecutionState({ kv: store }),
    jobRegistry: new KvJobRegistry({ kv: store }),
    taskRegistry: new KvTaskRegistry({ kv: store }),
    idempotency: new KvWorkerIdempotencyStore({ kv: store }),
  });
}
