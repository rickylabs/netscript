/** Deno KV-compatible list selector. */
export type KvListSelector = Readonly<{
  prefix: readonly unknown[];
}>;

/** Deno KV-compatible entry shape. */
export type KvEntry<TValue> = Readonly<{
  key: readonly unknown[];
  value: TValue | null;
}>;

/** Minimal KV shape consumed by registry adapters. */
export interface RegistryKvStore {
  /** Get a KV entry by key. */
  get<TValue>(key: readonly unknown[]): Promise<KvEntry<TValue> | null>;
  /** Set a KV entry by key. */
  set<TValue>(key: readonly unknown[], value: TValue): Promise<unknown>;
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
