/** Retention applied by the server when a producer creates a stream. */
export type StreamRetentionPolicyV1 =
  | Readonly<{ kind: 'ttl'; ttlSeconds: number }>
  | Readonly<{ kind: 'expires-at'; expiresAt: string }>;

/** Validate and copy create-time retention before starting any IO. */
export function retentionPolicy(
  policy: StreamRetentionPolicyV1 | undefined,
): StreamRetentionPolicyV1 | undefined {
  if (policy === undefined) return undefined;
  if (policy.kind === 'ttl') {
    if (!Number.isSafeInteger(policy.ttlSeconds) || policy.ttlSeconds <= 0) {
      throw new RangeError('Stream retention ttlSeconds must be a positive safe integer');
    }
    return Object.freeze({ kind: 'ttl', ttlSeconds: policy.ttlSeconds });
  }
  if (policy.kind === 'expires-at') {
    const match =
      /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/i
        .exec(policy.expiresAt);
    const month = Number(match?.[2]);
    const day = Number(match?.[3]);
    const days = new Date(Date.UTC(Number(match?.[1]), month, 0)).getUTCDate();
    if (
      !match || month < 1 || month > 12 || day < 1 || day > days ||
      !Number.isFinite(Date.parse(policy.expiresAt))
    ) {
      throw new RangeError('Stream retention expiresAt must be a valid RFC3339 timestamp');
    }
    return Object.freeze({ kind: 'expires-at', expiresAt: policy.expiresAt });
  }
  throw new TypeError('Unknown stream retention policy kind');
}
