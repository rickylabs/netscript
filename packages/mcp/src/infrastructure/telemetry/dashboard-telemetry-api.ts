import { isRecord } from '../../domain/schema.ts';
import { TELEMETRY_SAMPLE_LIMIT } from '../../domain/telemetry/telemetry-snapshot.ts';

/** Finite response budget keeps a faulty dashboard from exhausting diagnostic process memory. */
const MAX_RESPONSE_BYTES = 4 * 1024 * 1024;
/** Supported Aspire API key exchange and read endpoints. */
const API_PATH = '/api/telemetry/';

/** Safe status metadata used to distinguish a service-filter miss from transport failure. */
export class DashboardApiError extends Error {
  constructor(readonly status: number, readonly resourceLookup: boolean) {
    super('Dashboard API request failed');
  }
}

/** Read one bounded JSON response, rejecting status, redirect, parse and size failures. */
export async function readDashboardJson(
  fetcher: typeof fetch,
  url: URL,
  signal: AbortSignal,
  init: RequestInit = {},
): Promise<unknown> {
  const response = await fetcher(url, { ...init, signal, redirect: 'error' });
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new DashboardApiError(
      response.status,
      url.pathname.endsWith('/spans') || url.pathname.endsWith('/logs'),
    );
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) throw new Error('Dashboard response too large');
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

/** Exchange the private dashboard login token using the same supported endpoint as Aspire CLI. */
export async function dashboardApiHeaders(
  dashboard: URL,
  fetcher: typeof fetch,
  signal: AbortSignal,
): Promise<Headers> {
  const headers = new Headers({ accept: 'application/json' });
  const token = dashboard.searchParams.get('t');
  if (!token) return headers;
  const result = await readDashboardJson(
    fetcher,
    new URL(`${API_PATH}validateToken`, dashboard.origin),
    signal,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    },
  );
  if (!isRecord(result) || !(result.apiKey === null || typeof result.apiKey === 'string')) {
    throw new Error('Invalid dashboard authentication response');
  }
  if (result.apiKey) headers.set('x-api-key', result.apiKey);
  return headers;
}

/** Counts and raw records of a supported OTLP snapshot, validated before forgiving normalization. */
export interface DashboardSnapshotEnvelope {
  readonly payload: unknown;
  readonly totalCount: number;
  readonly returnedCount: number;
}

/** Reject missing/wrong OTLP envelopes instead of silently interpreting them as no samples. */
export function validateDashboardEnvelope(
  payload: unknown,
  kind: 'spans' | 'logs',
): DashboardSnapshotEnvelope {
  if (!isRecord(payload) || !isRecord(payload.data)) throw new Error('Invalid OTLP envelope');
  const groups = payload.data[kind === 'spans' ? 'resourceSpans' : 'resourceLogs'];
  if (!Array.isArray(groups)) throw new Error('Missing OTLP resource collection');
  let count = 0;
  for (const group of groups) {
    if (!isRecord(group) || !isRecord(group.resource)) throw new Error('Invalid OTLP resource');
    if (!Array.isArray(group.resource.attributes)) throw new Error('Invalid resource attributes');
    const scopes = group[kind === 'spans' ? 'scopeSpans' : 'scopeLogs'];
    if (!Array.isArray(scopes)) throw new Error('Invalid OTLP scopes');
    for (const scope of scopes) {
      if (!isRecord(scope)) throw new Error('Invalid OTLP scope');
      const records = scope[kind === 'spans' ? 'spans' : 'logRecords'];
      if (!Array.isArray(records)) throw new Error('Invalid OTLP records');
      for (const record of records) {
        if (!isRecord(record)) throw new Error('Invalid OTLP record');
        const time = record[kind === 'spans' ? 'startTimeUnixNano' : 'timeUnixNano'];
        if (
          !(typeof time === 'string' || typeof time === 'number') ||
          !Number.isFinite(Number(time)) || Number(time) <= 0
        ) {
          throw new Error('Invalid OTLP timestamp');
        }
        if (kind === 'spans') {
          for (const key of ['traceId', 'spanId', 'name']) {
            if (typeof record[key] !== 'string' || !record[key]) throw new Error('Invalid span');
          }
          if (
            record.endTimeUnixNano !== undefined &&
            (!Number.isFinite(Number(record.endTimeUnixNano)) ||
              Number(record.endTimeUnixNano) < Number(time))
          ) {
            throw new Error('Invalid span end time');
          }
        }
        count++;
        if (count > TELEMETRY_SAMPLE_LIMIT) throw new Error('Dashboard ignored snapshot limit');
      }
    }
  }
  const { totalCount, returnedCount } = payload;
  if (
    !Number.isSafeInteger(totalCount) || !Number.isSafeInteger(returnedCount) ||
    typeof totalCount !== 'number' || typeof returnedCount !== 'number' ||
    totalCount < returnedCount || returnedCount !== count
  ) {
    throw new Error('Invalid dashboard sample counts');
  }
  return { payload, totalCount, returnedCount };
}
