/** Cache tier values mirrored by the telemetry cache contract. */
export type CacheTopologyTier = 'l1' | 'l2' | 'durable';

/** Cache outcome values mirrored by the telemetry cache contract. */
export type CacheTopologyOutcome = 'hit' | 'miss' | 'stale' | 'error';

/** Stable identity and default tier advertised by a cache provider. */
export type CacheProviderDescriptor = {
  /** Stable lowercase provider identifier such as `deno-kv`, `redis`, or `memory`. */
  readonly system: string;
  /** Default tier used when an operation cannot provide a narrower report. */
  readonly tier: CacheTopologyTier;
};

/** One tier consulted during an ordered cache read. */
export type CacheLookupReport = CacheProviderDescriptor & {
  /** Zero-based position in the provider's lookup chain. */
  readonly lookupIndex: number;
  /** Result observed at this tier. */
  readonly outcome: CacheTopologyOutcome;
};

/** One tier written or promoted during a cache operation. */
export type CacheWriteReport = CacheProviderDescriptor & {
  /** Whether this write propagated through another tier. */
  readonly writeThrough: boolean;
  /** Error outcome when the write failed; successful writes omit this field. */
  readonly outcome?: CacheTopologyOutcome;
};

/** One tier affected during cache invalidation. */
export type CacheInvalidationReport = CacheProviderDescriptor & {
  /** Error outcome when invalidation failed; successful invalidations omit this field. */
  readonly outcome?: CacheTopologyOutcome;
};

/** Complete evidence returned by one cache-store lookup. */
export type CacheReadTopologyReport = {
  /** Non-empty lookup chain in provider execution order. */
  readonly lookups: readonly [CacheLookupReport, ...CacheLookupReport[]];
  /** Writes caused by a hit in a lower tier. */
  readonly promotions: readonly CacheWriteReport[];
  /** Whether every consulted tier is represented. */
  readonly topologyComplete: boolean;
};

/** Complete evidence returned by one cache-store write. */
export type CacheWriteTopologyReport = {
  /** Non-empty write chain in provider execution order. */
  readonly writes: readonly [CacheWriteReport, ...CacheWriteReport[]];
  /** Promotions performed as part of the write. */
  readonly promotions: readonly CacheWriteReport[];
  /** Whether every written tier is represented. */
  readonly topologyComplete: boolean;
};

/** Complete evidence returned by one cache-store invalidation. */
export type CacheInvalidationTopologyReport = {
  /** Non-empty invalidation chain in provider execution order. */
  readonly invalidations: readonly [CacheInvalidationReport, ...CacheInvalidationReport[]];
  /** Whether every invalidated tier is represented. */
  readonly topologyComplete: boolean;
};
