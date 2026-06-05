/** Generic registry base for named worker definitions. */
export abstract class Registry<TKey, TValue> {
  abstract readonly id: string;
  abstract register(key: TKey, value: TValue): Promise<void>;
  abstract get(key: TKey): Promise<TValue | undefined>;
  abstract entries(): Promise<readonly (readonly [TKey, TValue])[]>;
}
