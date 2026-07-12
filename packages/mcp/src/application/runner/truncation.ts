/** Server-side bounds applied to every successful tool result. */
export interface TruncationPolicy {
  /** Maximum elements preserved per array. */
  readonly maxItems: number;
  /** Maximum UTF-16 code units preserved per string. */
  readonly maxStringLength: number;
}

/** Default token-discipline limits. */
export const DEFAULT_TRUNCATION_POLICY: TruncationPolicy = { maxItems: 50, maxStringLength: 2000 };

/** Recursively bound arrays and strings in a JSON-compatible result. */
export function truncateResult(
  value: unknown,
  policy: TruncationPolicy = DEFAULT_TRUNCATION_POLICY,
): unknown {
  if (typeof value === 'string') {
    return value.length <= policy.maxStringLength
      ? value
      : `${value.slice(0, policy.maxStringLength)}…[truncated]`;
  }
  if (Array.isArray(value)) {
    return value.slice(0, policy.maxItems).map((item) => truncateResult(item, policy));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, truncateResult(item, policy)]),
    );
  }
  return value;
}
