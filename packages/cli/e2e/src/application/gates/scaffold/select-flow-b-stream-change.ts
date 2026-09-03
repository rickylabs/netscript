import type { StreamSseChangeV1, StreamSseReplayStateV1 } from '@netscript/plugin-streams-core/sse';

const TRACEPARENT_PATTERN = /^[0-9a-f]{2}-([0-9a-f]{32})-[0-9a-f]{16}-[0-9a-f]{2}$/i;

/** Producer identity used to select and verify the Flow-B stream record. */
export interface FlowBProducerIdentity {
  /** Correlation identity carried by the Flow-B job execution. */
  readonly correlationId: string;
  /** W3C trace id of the Flow-B job execution. */
  readonly traceId: string;
}

/** One named-SSE batch and its resulting replay state. */
export interface FlowBStreamBatch {
  /** Schema-validated changes received before the batch control frame. */
  readonly changes: readonly StreamSseChangeV1[];
  /** Replay state after the control frame commits its opaque offset. */
  readonly state: StreamSseReplayStateV1;
}

/** Bounded dependencies for reading until the Flow-B record appears. */
export interface FlowBSelectionOptions {
  /** Maximum number of control-delimited batches to inspect. */
  readonly maxBatches: number;
  /** Application SSE-record selection ceiling; it does not observe managed resource state. */
  readonly timeoutMs: number;
  /** Application SSE-batch delay; it is not a resource-readiness interval. */
  readonly retryDelayMs?: number;
  /** Read one batch, bounded by the remaining total time. */
  readonly readBatch: (
    state: StreamSseReplayStateV1,
    timeoutMs: number,
  ) => Promise<FlowBStreamBatch>;
  /** Monotonic clock override for deterministic tests. */
  readonly now?: () => number;
  /** Delay override for deterministic tests. */
  readonly wait?: (delayMs: number) => Promise<void>;
}

/** Successful bounded selection of the Flow-B execution stream record. */
export interface FlowBSelectionReceipt {
  /** The one execution record whose correlation matches the producer. */
  readonly change: StreamSseChangeV1;
  /** Replay state committed by the batch containing the record. */
  readonly state: StreamSseReplayStateV1;
  /** Number of batches inspected, including the matching batch. */
  readonly batchesRead: number;
  /** Distinct semantic correlation identities observed before selection. */
  readonly seenCorrelationIds: readonly string[];
}

/** Minimal record surface accepted by the TC-14 W3C context assertion. */
export interface FlowBTraceCandidate {
  /** Stream value; execution records carry their semantic correlation here. */
  readonly value?: unknown;
  /** Record headers supplied by the durable producer. */
  readonly headers: Readonly<{
    readonly correlationId?: string;
    readonly traceparent?: string;
  }>;
}

/**
 * Consume bounded named-SSE batches until the actual Flow-B execution record appears.
 *
 * Startup job snapshots and other stream traffic are retained as observed identities but never
 * contribute links to the returned Flow-B consumer receipt.
 */
export async function selectFlowBStreamChange(
  identity: FlowBProducerIdentity,
  initialState: StreamSseReplayStateV1,
  options: FlowBSelectionOptions,
): Promise<FlowBSelectionReceipt> {
  if (!Number.isInteger(options.maxBatches) || options.maxBatches < 1) {
    throw new Error('Flow-B selection maxBatches must be a positive integer');
  }
  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
    throw new Error('Flow-B selection timeoutMs must be positive');
  }

  const now = options.now ?? performance.now.bind(performance);
  const wait = options.wait ??
    ((delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)));
  const deadline = now() + options.timeoutMs;
  const seen = new Set<string>();
  let state = initialState;
  let batchesRead = 0;

  while (batchesRead < options.maxBatches) {
    const remainingMs = deadline - now();
    if (remainingMs <= 0) break;
    const batch = await options.readBatch(state, remainingMs);
    batchesRead++;
    state = batch.state;

    for (const change of batch.changes) {
      const correlationId = streamChangeCorrelationId(change);
      if (correlationId) seen.add(correlationId);
      if (correlationId !== identity.correlationId) continue;
      assertFlowBChangeContext(identity, change);
      return {
        change,
        state,
        batchesRead,
        seenCorrelationIds: [...seen],
      };
    }

    const retryDelayMs = options.retryDelayMs ?? 0;
    const remainingAfterBatch = deadline - now();
    if (retryDelayMs > 0 && remainingAfterBatch > 0) {
      await wait(Math.min(retryDelayMs, remainingAfterBatch));
    }
  }

  const observed = seen.size > 0 ? [...seen].join(', ') : '<none>';
  throw new Error(
    `Flow-B stream selection exhausted after ${batchesRead}/${options.maxBatches} batch(es) within ${options.timeoutMs}ms; expectedCorrelationId=${identity.correlationId} observedCorrelationIds=[${observed}]`,
  );
}

/** Return the semantic correlation identity carried by one stream change. */
export function streamChangeCorrelationId(change: FlowBTraceCandidate): string | undefined {
  if (isRecord(change.value)) {
    const valueCorrelation = nonEmptyString(change.value.correlationId);
    if (valueCorrelation) return valueCorrelation;
  }
  return nonEmptyString(change.headers.correlationId);
}

/** Assert that the matched Flow-B record retains the producer's W3C trace identity. */
export function assertFlowBChangeContext(
  identity: FlowBProducerIdentity,
  change: FlowBTraceCandidate,
): void {
  const correlationId = streamChangeCorrelationId(change) ?? '<missing>';
  const traceparent = nonEmptyString(change.headers.traceparent);
  if (!traceparent) {
    throw new Error(
      `TC-14 FAIL: matched Flow-B record has no traceparent; producerTraceId=${identity.traceId} correlationId=${correlationId}`,
    );
  }
  const recordTraceId = TRACEPARENT_PATTERN.exec(traceparent)?.[1]?.toLowerCase();
  if (!recordTraceId) {
    throw new Error(
      `TC-14 FAIL: matched Flow-B record has malformed traceparent; producerTraceId=${identity.traceId} correlationId=${correlationId} traceparent=${traceparent}`,
    );
  }
  if (recordTraceId !== identity.traceId.toLowerCase()) {
    throw new Error(
      `TC-14 FAIL: matched Flow-B record trace differs from producer; producerTraceId=${identity.traceId} recordTraceId=${recordTraceId} correlationId=${correlationId}`,
    );
  }
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
