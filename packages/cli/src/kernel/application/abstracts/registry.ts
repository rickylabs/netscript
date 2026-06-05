/** Stub-only contract for a typed registry extension axis. */
export abstract class Registry<TKey, TValue> {
  /** Stable registry identifier listed in extension manifests. */
  abstract readonly id: string;

  /** Register one value for a key. */
  abstract register(key: TKey, value: TValue): void;

  /** Resolve one registered value. */
  abstract get(key: TKey): TValue | undefined;

  /** List registered entries in deterministic order. */
  abstract entries(): readonly (readonly [TKey, TValue])[];
}
