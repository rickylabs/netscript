/** Generic registry base for named worker definitions. */
export abstract class Registry<TKey, TValue> {
  /** Stable registry identifier. */
  abstract readonly id: string;
  /** Register or replace a value by key. */
  abstract register(key: TKey, value: TValue): Promise<void>;
  /** Get a value by key. */
  abstract get(key: TKey): Promise<TValue | undefined>;
  /** List raw registry entries. */
  abstract entries(): Promise<readonly (readonly [TKey, TValue])[]>;
}
