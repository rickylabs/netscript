import {
  type CacheOperation,
  CacheOperations,
  type CacheOutcome,
  CacheOutcomes,
  CacheTiers,
  createCacheAttributes,
} from '@netscript/telemetry/attributes';
import { withContextAsync } from '@netscript/telemetry/context';
import {
  getActiveContext,
  getTracer,
  SpanKind,
  withSpan as withTelemetrySpan,
} from '@netscript/telemetry/tracer';
import type {
  CacheInvalidationTopologyReport,
  CacheLookupReport,
  CacheProviderDescriptor,
  CacheReadTopologyReport,
  CacheWriteReport,
  CacheWriteTopologyReport,
} from '../ports/cache-topology.ts';

/** Maximum length of a cache operation namespace. */
export const CACHE_NAMESPACE_MAX_LENGTH = 80 as const;
const CACHE_SYSTEM_MAX_LENGTH = 64;

/** Span attributes accepted by the SDK cache telemetry seam. */
export type CacheSpanAttributes = Readonly<
  Record<string, string | number | boolean | string[] | number[] | boolean[] | undefined>
>;

/** Logical cache span names mirrored by the telemetry cache contract. */
export type CacheSpanName = 'cache.read' | 'cache.write' | 'cache.invalidate';

/** Narrow span surface consumed by cache operation instrumentation. */
export interface CacheTelemetrySpan {
  /** Set several attributes on the logical cache span. */
  setAttributes(attributes: CacheSpanAttributes): void;
  /** Add an ordered cache tier event. */
  addEvent(name: string, attributes?: CacheSpanAttributes): void;
}

/** Captured parent that can explicitly continue background cache work. */
export interface CacheTelemetryParent {
  /** Run asynchronous work inside the captured trace context. */
  run<T>(operation: () => Promise<T>): Promise<T>;
}

/** Injectable telemetry collaborator used by {@link CacheQuery}. */
export interface CacheTelemetry {
  /** Run one logical cache operation inside one INTERNAL span. */
  withSpan<T>(
    name: CacheSpanName,
    attributes: CacheSpanAttributes,
    operation: (span: CacheTelemetrySpan) => Promise<T>,
  ): Promise<T>;
  /** Capture the active read span for a bounded background follow-up. */
  captureParent(): CacheTelemetryParent;
}

/** Ordered cache event names. */
export const CacheEvents = {
  LOOKUP: 'cache.lookup',
  WRITE: 'cache.write',
  PROMOTE: 'cache.promote',
  INVALIDATE: 'cache.invalidate',
} as const;

const CACHE_TRACER_NAME = '@netscript/sdk/cache';
const SYSTEM_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;
const VALID_TIERS = new Set<string>(Object.values(CacheTiers));
const VALID_OUTCOMES = new Set<string>(Object.values(CacheOutcomes));
const MAX_CACHE_TIERS = VALID_TIERS.size;

/** Normalize a caller-supplied operation identity to bounded cache namespace syntax. */
export function normalizeCacheNamespace(value: string | undefined, fallback = 'direct'): string {
  const normalize = (candidate: string): string =>
    candidate
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '.')
      .replace(/[._-]+/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .slice(0, CACHE_NAMESPACE_MAX_LENGTH)
      .replace(/\.+$/g, '');
  return normalize(value ?? '') || normalize(fallback) || 'direct';
}

/** Create the standard OpenTelemetry-backed cache collaborator. */
export function createDefaultCacheTelemetry(): CacheTelemetry {
  return {
    withSpan: <T>(
      name: CacheSpanName,
      attributes: CacheSpanAttributes,
      operation: (span: CacheTelemetrySpan) => Promise<T>,
    ): Promise<T> =>
      withTelemetrySpan(
        getTracer(CACHE_TRACER_NAME),
        name,
        operation,
        { kind: SpanKind.INTERNAL, attributes },
      ),
    captureParent: (): CacheTelemetryParent => {
      const parent = getActiveContext();
      return {
        run: <T>(operation: () => Promise<T>): Promise<T> => withContextAsync(parent, operation),
      };
    },
  };
}

/** Build initial attributes for a logical operation span. */
export function createCacheSpanAttributes(
  operation: CacheOperation,
  namespace: string,
  descriptor: CacheProviderDescriptor,
): CacheSpanAttributes {
  validateDescriptor(descriptor);
  return createCacheAttributes({
    operation,
    namespace,
    ...descriptor,
    backendExecuted: false,
    inflightJoined: false,
    topologyComplete: true,
  });
}

/** Update the measured loader and in-flight-join facts on a logical span. */
export function recordCacheExecutionState(
  span: CacheTelemetrySpan,
  operation: CacheOperation,
  namespace: string,
  descriptor: CacheProviderDescriptor,
  backendExecuted: boolean,
  inflightJoined: boolean,
): void {
  span.setAttributes(createCacheAttributes({
    operation,
    namespace,
    ...descriptor,
    backendExecuted,
    inflightJoined,
  }));
}

function validateDescriptor(descriptor: CacheProviderDescriptor): void {
  if (
    descriptor.system.length > CACHE_SYSTEM_MAX_LENGTH ||
    !SYSTEM_PATTERN.test(descriptor.system) || !VALID_TIERS.has(descriptor.tier)
  ) {
    throw new TypeError('Cache provider reports must use a stable system id and bounded tier');
  }
}

function validateOutcome(outcome: string): void {
  if (!VALID_OUTCOMES.has(outcome)) {
    throw new TypeError('Cache provider reports must use a bounded outcome');
  }
}

function recordIncompleteTopology(
  span: CacheTelemetrySpan,
  operation: CacheOperation,
  namespace: string,
  descriptor: CacheProviderDescriptor,
  event: string,
): never {
  const attributes = createCacheAttributes({
    operation,
    namespace,
    ...descriptor,
    outcome: CacheOutcomes.ERROR,
    topologyComplete: false,
  });
  span.setAttributes(attributes);
  span.addEvent(event, attributes);
  throw new TypeError('Cache provider returned missing or invalid topology evidence');
}

function validateLookupChain(report: CacheReadTopologyReport): void {
  if (
    !report.topologyComplete || report.lookups.length === 0 ||
    report.lookups.length > MAX_CACHE_TIERS || report.promotions.length > MAX_CACHE_TIERS
  ) {
    throw new TypeError('Cache lookup topology is incomplete');
  }
  const tiers = new Set<string>();
  report.lookups.forEach((lookup, index) => {
    validateDescriptor(lookup);
    validateOutcome(lookup.outcome);
    if (lookup.lookupIndex !== index || tiers.has(lookup.tier)) {
      throw new TypeError('Cache lookup indices must be contiguous and ordered');
    }
    tiers.add(lookup.tier);
  });
  report.promotions.forEach(validateWriteReport);
}

function validateWriteReport(report: CacheWriteReport): void {
  validateDescriptor(report);
  if (report.outcome !== undefined) {
    validateOutcome(report.outcome);
  }
}

function lookupAttributes(
  operation: CacheOperation,
  namespace: string,
  lookup: CacheLookupReport,
  outcome: CacheOutcome,
  entryAgeMs: number | undefined,
  ttlMs: number | undefined,
  topologyComplete: boolean,
): CacheSpanAttributes {
  return createCacheAttributes({
    operation,
    namespace,
    ...lookup,
    outcome,
    entryAgeMs,
    ttlMs,
    topologyComplete,
  });
}

function writeAttributes(
  operation: CacheOperation,
  namespace: string,
  report: CacheWriteReport,
  topologyComplete: boolean,
): CacheSpanAttributes {
  return createCacheAttributes({
    operation,
    namespace,
    ...report,
    topologyComplete,
  });
}

/** Record an ordered lookup chain and any promotions, then return its authoritative outcome. */
export function recordCacheLookup(
  span: CacheTelemetrySpan,
  namespace: string,
  descriptor: CacheProviderDescriptor,
  report: CacheReadTopologyReport,
  options: {
    readonly authoritativeOutcome?: CacheOutcome;
    readonly entryAgeMs?: number;
    readonly ttlMs?: number;
  } = {},
): CacheOutcome {
  try {
    validateLookupChain(report);
  } catch {
    return recordIncompleteTopology(
      span,
      CacheOperations.READ,
      namespace,
      descriptor,
      CacheEvents.LOOKUP,
    );
  }

  const lastIndex = report.lookups.length - 1;
  report.lookups.forEach((lookup, index) => {
    const outcome = index === lastIndex && options.authoritativeOutcome
      ? options.authoritativeOutcome
      : lookup.outcome;
    span.addEvent(
      CacheEvents.LOOKUP,
      lookupAttributes(
        CacheOperations.READ,
        namespace,
        lookup,
        outcome,
        index === lastIndex ? options.entryAgeMs : undefined,
        index === lastIndex ? options.ttlMs : undefined,
        true,
      ),
    );
  });

  for (const promotion of report.promotions) {
    span.addEvent(
      CacheEvents.PROMOTE,
      writeAttributes(CacheOperations.READ, namespace, promotion, true),
    );
  }

  const authoritative = report.lookups[lastIndex];
  const outcome = options.authoritativeOutcome ?? authoritative.outcome;
  span.setAttributes(
    lookupAttributes(
      CacheOperations.READ,
      namespace,
      authoritative,
      outcome,
      options.entryAgeMs,
      options.ttlMs,
      true,
    ),
  );
  return outcome;
}

/** Record every tier affected by a cache write. */
export function recordCacheWrite(
  span: CacheTelemetrySpan,
  operation: CacheOperation,
  namespace: string,
  descriptor: CacheProviderDescriptor,
  report: CacheWriteTopologyReport,
): void {
  try {
    if (
      !report.topologyComplete || report.writes.length === 0 ||
      report.writes.length > MAX_CACHE_TIERS || report.promotions.length > MAX_CACHE_TIERS
    ) {
      throw new TypeError('Cache write topology is incomplete');
    }
    report.writes.forEach(validateWriteReport);
    report.promotions.forEach(validateWriteReport);
  } catch {
    recordIncompleteTopology(span, operation, namespace, descriptor, CacheEvents.WRITE);
  }

  for (const write of report.writes) {
    span.addEvent(CacheEvents.WRITE, writeAttributes(operation, namespace, write, true));
  }
  for (const promotion of report.promotions) {
    span.addEvent(CacheEvents.PROMOTE, writeAttributes(operation, namespace, promotion, true));
  }
  span.setAttributes(createCacheAttributes({ operation, namespace, ...descriptor }));
}

/** Record a bounded invalidation report. */
export function recordCacheInvalidation(
  span: CacheTelemetrySpan,
  namespace: string,
  descriptor: CacheProviderDescriptor,
  reports: readonly CacheInvalidationTopologyReport[],
): void {
  if (reports.length === 0) {
    span.setAttributes(createCacheAttributes({
      operation: CacheOperations.INVALIDATE,
      namespace,
      ...descriptor,
      topologyComplete: true,
    }));
    return;
  }

  const invalidationsByTier = new Map<
    string,
    CacheInvalidationTopologyReport['invalidations'][0]
  >();
  for (const report of reports) {
    try {
      if (
        !report.topologyComplete || report.invalidations.length === 0 ||
        report.invalidations.length > MAX_CACHE_TIERS
      ) {
        throw new TypeError('Cache invalidation topology is incomplete');
      }
      for (const invalidation of report.invalidations) {
        validateDescriptor(invalidation);
        if (invalidation.outcome !== undefined) {
          validateOutcome(invalidation.outcome);
        }
        const existing = invalidationsByTier.get(invalidation.tier);
        if (
          existing &&
          (existing.system !== invalidation.system || existing.outcome !== invalidation.outcome)
        ) {
          throw new TypeError('Cache invalidation tier reports must be consistent');
        }
        invalidationsByTier.set(invalidation.tier, invalidation);
      }
    } catch {
      recordIncompleteTopology(
        span,
        CacheOperations.INVALIDATE,
        namespace,
        descriptor,
        CacheEvents.INVALIDATE,
      );
    }
  }
  for (const invalidation of invalidationsByTier.values()) {
    span.addEvent(
      CacheEvents.INVALIDATE,
      createCacheAttributes({
        operation: CacheOperations.INVALIDATE,
        namespace,
        ...invalidation,
        topologyComplete: true,
      }),
    );
  }
  span.setAttributes(createCacheAttributes({
    operation: CacheOperations.INVALIDATE,
    namespace,
    ...descriptor,
    topologyComplete: true,
  }));
}

/** Mark a provider/store failure before a valid operation report was returned. */
export function recordCacheProviderError(
  span: CacheTelemetrySpan,
  operation: CacheOperation,
  namespace: string,
  descriptor: CacheProviderDescriptor,
  event: string,
): void {
  const attributes = createCacheAttributes({
    operation,
    namespace,
    ...descriptor,
    outcome: CacheOutcomes.ERROR,
    topologyComplete: false,
  });
  span.setAttributes(attributes);
  span.addEvent(event, attributes);
}

/** Mark a successful provider operation whose internal tier topology is unavailable. */
export function recordCacheProviderTopologyUnknown(
  span: CacheTelemetrySpan,
  operation: CacheOperation,
  namespace: string,
  descriptor: CacheProviderDescriptor,
  event: string,
): void {
  const attributes = createCacheAttributes({
    operation,
    namespace,
    ...descriptor,
    topologyComplete: false,
  });
  span.setAttributes(attributes);
  span.addEvent(event, attributes);
}
