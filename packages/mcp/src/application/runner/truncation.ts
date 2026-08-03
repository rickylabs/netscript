/** Server-side bounds applied to every successful tool result. */
export interface TruncationPolicy {
  /** Maximum elements preserved per array. */
  readonly maxItems: number;
  /** Maximum UTF-16 code units preserved per string. */
  readonly maxStringLength: number;
}

/** Default token-discipline limits. */
export const DEFAULT_TRUNCATION_POLICY: TruncationPolicy = { maxItems: 50, maxStringLength: 2000 };

const MAX_SERIALIZED_RESULT_BYTES = 64 * 1024;

interface TruncationOutcome {
  readonly value: unknown;
  readonly truncated: boolean;
}

/** Internal signal that a bounded result still exceeds the transport budget. */
export class ResultByteLimitError extends Error {
  constructor(readonly actualBytes: number) {
    super(
      `Tool result is ${actualBytes} UTF-8 bytes after truncation; limit is ${MAX_SERIALIZED_RESULT_BYTES}`,
    );
    this.name = 'ResultByteLimitError';
  }
}

/** Recursively bound arrays and strings in a JSON-compatible result. */
export function truncateResult(
  value: unknown,
  policy: TruncationPolicy = DEFAULT_TRUNCATION_POLICY,
): unknown {
  const outcome = truncateValue(value, policy);
  const serialized = JSON.stringify(outcome.value);
  const byteLength = new TextEncoder().encode(serialized).byteLength;
  if (byteLength > MAX_SERIALIZED_RESULT_BYTES) throw new ResultByteLimitError(byteLength);
  return outcome.value;
}

function truncateValue(value: unknown, policy: TruncationPolicy): TruncationOutcome {
  if (typeof value === 'string') {
    return value.length <= policy.maxStringLength ? { value, truncated: false } : {
      value: `${value.slice(0, policy.maxStringLength)}…[truncated]`,
      truncated: true,
    };
  }
  if (Array.isArray(value)) {
    const outcomes = value.slice(0, policy.maxItems).map((item) => truncateValue(item, policy));
    return {
      value: outcomes.map((outcome) => outcome.value),
      truncated: value.length > policy.maxItems || outcomes.some((outcome) => outcome.truncated),
    };
  }
  if (value !== null && typeof value === 'object') {
    const outcomes = Object.entries(value).map(([key, item]) =>
      [
        key,
        truncateValue(item, policy),
      ] as const
    );
    const truncated = outcomes.some(([, outcome]) => outcome.truncated);
    const bounded = Object.fromEntries(outcomes.map(([key, outcome]) => [key, outcome.value]));
    if (truncated && typeof bounded.truncated === 'boolean') bounded.truncated = true;
    return { value: bounded, truncated };
  }
  return { value, truncated: false };
}
