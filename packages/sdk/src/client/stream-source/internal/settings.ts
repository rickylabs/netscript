import type {
  FetchStreamEventSourceOptionsV1,
  StreamSourceSchedulerV1,
} from '../ports/fetch-stream-source.ts';

const DEFAULT_SCHEDULER: StreamSourceSchedulerV1 = {
  schedule(callback, delayMs) {
    const timer = setTimeout(callback, delayMs);
    return () => clearTimeout(timer);
  },
};

/** Validated bounds and timer port resolved once at the composition edge. */
export interface StreamSourceSettings {
  readonly scheduler: StreamSourceSchedulerV1;
  readonly heartbeatMs: number;
  readonly cap: number;
  readonly bufferSize: number;
  readonly pendingEvents: number;
  readonly initialDelay: number;
  readonly terminalStatuses: ReadonlySet<number>;
}

function positiveInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value <= 0 || value > 2_147_483_647) {
    throw new RangeError(`${name} must be a positive integer no greater than 2147483647`);
  }
  return value;
}

function resolveTerminalStatuses(statuses: readonly number[] | undefined): ReadonlySet<number> {
  const result = new Set<number>();
  if (statuses === undefined) return result;
  if (!Array.isArray(statuses)) {
    throw new TypeError('terminalStatuses must be an array of non-2xx HTTP status codes');
  }
  for (const status of statuses) {
    if (
      typeof status !== 'number' ||
      !Number.isSafeInteger(status) ||
      status < 100 ||
      status > 599 ||
      (status >= 200 && status <= 299)
    ) {
      throw new RangeError(
        `terminalStatuses entries must be non-2xx HTTP status codes (100-199 or 300-599): ${
          String(status)
        }`,
      );
    }
    result.add(status);
  }
  return result;
}

/** Resolve finite timer and allocation budgets before starting any IO. */
export function resolveStreamSourceSettings(
  options: FetchStreamEventSourceOptionsV1,
): StreamSourceSettings {
  const cap = positiveInteger(options.maxReconnectDelayMs ?? 30_000, 'maxReconnectDelayMs');
  const bufferSize = positiveInteger(options.maxBufferSize ?? 1_048_576, 'maxBufferSize');
  const lastEventId = options.lastEventId ?? '';
  if (
    lastEventId.includes('\0') || lastEventId.includes('\r') || lastEventId.includes('\n') ||
    lastEventId.length > bufferSize
  ) {
    throw new TypeError('lastEventId must be a bounded SSE identifier');
  }
  if (options.onHttpError !== undefined && typeof options.onHttpError !== 'function') {
    throw new TypeError('onHttpError must be a function when provided');
  }
  return {
    scheduler: options.scheduler ?? DEFAULT_SCHEDULER,
    heartbeatMs: positiveInteger(options.heartbeatTimeoutMs ?? 30_000, 'heartbeatTimeoutMs'),
    cap,
    bufferSize,
    pendingEvents: positiveInteger(options.maxPendingEvents ?? 1_024, 'maxPendingEvents'),
    initialDelay: Math.min(
      positiveInteger(options.reconnectDelayMs ?? 1_000, 'reconnectDelayMs'),
      cap,
    ),
    terminalStatuses: resolveTerminalStatuses(options.terminalStatuses),
  };
}
