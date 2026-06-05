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
  get<TValue>(key: readonly unknown[]): Promise<KvEntry<TValue> | null>;
  set<TValue>(key: readonly unknown[], value: TValue): Promise<unknown>;
  delete(key: readonly unknown[]): Promise<unknown>;
  list<TValue>(selector: KvListSelector): AsyncIterable<KvEntry<TValue>>;
}

/** Registry adapter options. */
export type RegistryOptions = Readonly<{
  id?: string;
  topic?: string;
  kv?: RegistryKvStore;
}>;
