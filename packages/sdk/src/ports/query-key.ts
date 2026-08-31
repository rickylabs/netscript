/**
 * Query-key contracts and helpers for the SDK cache/query system.
 *
 * @module
 */

/**
 * Primitive query-key segment supported by the SDK cache layer.
 */
export type QueryKeyPart = string | number | boolean | null | undefined;

/**
 * Serializable query key used to address cached entries.
 */
export type QueryKey = readonly QueryKeyPart[];

/** Optional server-cache suffix for contribution-partitioned calls. */
export type SdkClientServerKeySuffix =
  | readonly []
  | readonly ['$netscript.sdk-context', string];

/** Canonical full server-cache key for a resource action. */
export type ActionQueryKey<
  TAction extends string = string,
  TSuffix extends SdkClientServerKeySuffix = readonly [],
> = readonly [
  resource: string,
  action: TAction,
  serializedInput: string,
  ...suffix: TSuffix,
];

/**
 * Serialize structured query input into the canonical cache-key segment.
 *
 * @param value - Structured query input.
 * @returns Serialized cache-key segment.
 */
export function serializeQueryKeyInput(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * Build a canonical `[resource, action, input]` query key.
 *
 * @param resource - Resource identifier.
 * @param action - Action/procedure name.
 * @param input - Action input payload.
 * @returns Canonical action query key.
 */
export function createActionQueryKey<
  const TAction extends string,
  const TSuffix extends SdkClientServerKeySuffix = readonly [],
>(
  resource: string,
  action: TAction,
  input: unknown,
  suffix?: TSuffix,
): ActionQueryKey<TAction, TSuffix> {
  return [
    resource,
    action,
    serializeQueryKeyInput(input),
    ...(suffix ?? []),
  ] as ActionQueryKey<TAction, TSuffix>;
}
