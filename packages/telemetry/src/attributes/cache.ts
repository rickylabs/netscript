import type { TelemetryAttributeBuilderMap } from './helpers.ts';

/**
 * Cache topology attribute names.
 *
 * Cache namespaces identify a normalized operation or contract. They never
 * contain cache keys, serialized inputs, values, URLs, or user data.
 */
export const CacheAttributes = {
  OPERATION: 'netscript.operation',
  SYSTEM: 'netscript.cache.system',
  TIER: 'netscript.cache.tier',
  NAMESPACE: 'netscript.cache.namespace',
  OUTCOME: 'netscript.cache.outcome',
  LOOKUP_INDEX: 'netscript.cache.lookup_index',
  BACKEND_EXECUTED: 'netscript.cache.backend_executed',
  ENTRY_AGE_MS: 'netscript.cache.entry_age_ms',
  TTL_MS: 'netscript.cache.ttl_ms',
  WRITE_THROUGH: 'netscript.cache.write_through',
  INFLIGHT_JOINED: 'netscript.cache.inflight_joined',
  TOPOLOGY_COMPLETE: 'netscript.cache.topology_complete',
} as const;

/** Logical cache operations represented by one INTERNAL span. */
export const CacheOperations = {
  READ: 'cache.read',
  WRITE: 'cache.write',
  INVALIDATE: 'cache.invalidate',
} as const;

/** Logical cache operation. */
export type CacheOperation = (typeof CacheOperations)[keyof typeof CacheOperations];

/** Bounded cache tier identifiers. */
export const CacheTiers = {
  L1: 'l1',
  L2: 'l2',
  DURABLE: 'durable',
} as const;

/** Cache tier identifier. */
export type CacheTier = (typeof CacheTiers)[keyof typeof CacheTiers];

/** Bounded cache lookup and mutation outcomes. */
export const CacheOutcomes = {
  HIT: 'hit',
  MISS: 'miss',
  STALE: 'stale',
  ERROR: 'error',
} as const;

/** Cache lookup or mutation outcome. */
export type CacheOutcome = (typeof CacheOutcomes)[keyof typeof CacheOutcomes];

/** Options accepted by {@link createCacheAttributes}. */
export type CacheAttributeOptions = {
  /** Logical cache operation represented by the span or event. */
  readonly operation: CacheOperation;
  /** Stable provider identifier, such as `deno-kv`, `redis`, or `memory`. */
  readonly system: string;
  /** Normalized operation or contract identity, never a cache key. */
  readonly namespace: string;
  /** Tier involved in this lookup or mutation. */
  readonly tier?: CacheTier;
  /** Result of this lookup or mutation. */
  readonly outcome?: CacheOutcome;
  /** Zero-based position in the ordered lookup chain. */
  readonly lookupIndex?: number;
  /** Whether this trace entered the backing loader. */
  readonly backendExecuted?: boolean;
  /** Age of the cache entry in milliseconds. */
  readonly entryAgeMs?: number;
  /** Configured cache retention in milliseconds. */
  readonly ttlMs?: number;
  /** Whether the write propagated through another tier. */
  readonly writeThrough?: boolean;
  /** Whether this trace joined work started by another trace. */
  readonly inflightJoined?: boolean;
  /** Whether the provider supplied a complete topology report. */
  readonly topologyComplete?: boolean;
};

function setOptional(
  attributes: TelemetryAttributeBuilderMap,
  key: string,
  value: string | boolean | undefined,
): void {
  if (value !== undefined) {
    attributes[key] = value;
  }
}

function setNonNegativeInteger(
  attributes: TelemetryAttributeBuilderMap,
  key: string,
  value: number | undefined,
): void {
  if (value === undefined) {
    return;
  }
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${key} must be a non-negative safe integer`);
  }
  attributes[key] = value;
}

/**
 * Build bounded cache-topology attributes without accepting raw cache keys.
 *
 * @param options - Stable operation identity and optional topology facts.
 * @returns Attributes ready to attach to a logical cache span or tier event.
 */
export function createCacheAttributes(
  options: CacheAttributeOptions,
): TelemetryAttributeBuilderMap {
  const attributes: TelemetryAttributeBuilderMap = {
    [CacheAttributes.OPERATION]: options.operation,
    [CacheAttributes.SYSTEM]: options.system,
    [CacheAttributes.NAMESPACE]: options.namespace,
  };

  setOptional(attributes, CacheAttributes.TIER, options.tier);
  setOptional(attributes, CacheAttributes.OUTCOME, options.outcome);
  setNonNegativeInteger(attributes, CacheAttributes.LOOKUP_INDEX, options.lookupIndex);
  setOptional(attributes, CacheAttributes.BACKEND_EXECUTED, options.backendExecuted);
  setNonNegativeInteger(attributes, CacheAttributes.ENTRY_AGE_MS, options.entryAgeMs);
  setNonNegativeInteger(attributes, CacheAttributes.TTL_MS, options.ttlMs);
  setOptional(attributes, CacheAttributes.WRITE_THROUGH, options.writeThrough);
  setOptional(attributes, CacheAttributes.INFLIGHT_JOINED, options.inflightJoined);
  setOptional(attributes, CacheAttributes.TOPOLOGY_COMPLETE, options.topologyComplete);

  return attributes;
}
