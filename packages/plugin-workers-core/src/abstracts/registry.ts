/** Stub-only contract for keyed workers registries. */
export abstract class Registry<TKey, TValue> {
  abstract readonly id: string;
  abstract register(key: TKey, value: TValue): void;
  abstract get(key: TKey): TValue | undefined;
  abstract entries(): readonly (readonly [TKey, TValue])[];
}
