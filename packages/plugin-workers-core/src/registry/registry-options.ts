import type { AtomicCheck, AtomicMutation, AtomicResult, KvSetOptions } from '@netscript/kv';

/** Deno KV-compatible list selector. */
export type KvListSelector = Readonly<{
  prefix: readonly unknown[];
  limit?: number;
  start?: readonly unknown[];
}>;

/** Deno KV-compatible entry shape. */
export type KvEntry<TValue> = Readonly<{
  key: readonly unknown[];
  value: TValue | null;
  versionstamp?: string | null;
}>;

/** Minimal KV shape consumed by registry adapters. */
export interface RegistryKvStore {
  /** Get a KV entry by key. */
  get<TValue>(key: readonly unknown[]): Promise<KvEntry<TValue> | null>;
  /** Set a KV entry by key. */
  set<TValue>(key: readonly unknown[], value: TValue, options?: KvSetOptions): Promise<unknown>;
  /** Compare versions and apply mutations atomically when supported. */
  atomic?(checks: AtomicCheck[], mutations: AtomicMutation[]): Promise<AtomicResult>;
  /** Delete a KV entry by key. */
  delete(key: readonly unknown[]): Promise<unknown>;
  /** List KV entries by selector. */
  list<TValue>(selector: KvListSelector): AsyncIterable<KvEntry<TValue>>;
}

/** Registry adapter options. */
export type RegistryOptions = Readonly<{
  id?: string;
  topic?: string;
  kv?: RegistryKvStore;
}>;
