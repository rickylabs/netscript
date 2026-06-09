/** Stub-only contract for keyed workers registries. */
export abstract class Registry<TKey, TValue> {
  /** Stable registry identifier. */
  abstract readonly id: string;
  /** Register or replace a value by key. */
  abstract register(key: TKey, value: TValue): void;
  /** Get a value by key. */
  abstract get(key: TKey): TValue | undefined;
  /** List all registry entries. */
  abstract entries(): readonly (readonly [TKey, TValue])[];
}
