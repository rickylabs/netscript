/** Bounded CDP failure evidence for the generated service-client browser probe. */

const EVENT_LIMIT = 20;
const TEXT_LIMIT = 500;

export interface BrowserDiagnosticEvent {
  readonly method: string;
  readonly params: Record<string, unknown>;
}

export interface FailedNetworkRequestEvidence {
  readonly url: string | null;
  readonly method: string | null;
  readonly status: number | null;
  readonly errorText: string | null;
}

export interface BrowserPageEventEvidence {
  readonly documentHttpStatus: number | null;
  readonly documentUrl: string | null;
  readonly consoleErrors: readonly string[];
  readonly failedNetworkRequests: readonly FailedNetworkRequestEvidence[];
}

export interface BrowserPageDiagnosticsCollector {
  observe(event: BrowserDiagnosticEvent): void;
  snapshot(): BrowserPageEventEvidence;
}

/** Retain page-load failures that explain a missing generated island. */
export function createBrowserPageDiagnosticsCollector(): BrowserPageDiagnosticsCollector {
  const requests = new Map<
    string,
    { readonly url: string | null; readonly method: string | null }
  >();
  const consoleErrors: string[] = [];
  const failedNetworkRequests: FailedNetworkRequestEvidence[] = [];
  let documentHttpStatus: number | null = null;
  let documentUrl: string | null = null;

  return {
    observe({ method, params }) {
      if (method === 'Network.requestWillBeSent') {
        const requestId = typeof params.requestId === 'string' ? params.requestId : undefined;
        const request = recordValue(params.request);
        if (requestId) {
          requests.set(requestId, {
            url: stringValue(request?.url),
            method: stringValue(request?.method),
          });
        }
        return;
      }

      if (method === 'Network.responseReceived') {
        const response = recordValue(params.response);
        const status = numberValue(response?.status);
        const url = stringValue(response?.url);
        if (params.type === 'Document') {
          documentHttpStatus = status;
          documentUrl = url;
        }
        if (status !== null && status >= 400) {
          const requestId = typeof params.requestId === 'string' ? params.requestId : undefined;
          const request = requestId ? requests.get(requestId) : undefined;
          pushBounded(failedNetworkRequests, {
            url: boundedNullableText(url ?? request?.url ?? null),
            method: request?.method ?? null,
            status,
            errorText: null,
          });
        }
        return;
      }

      if (method === 'Network.loadingFailed') {
        const requestId = typeof params.requestId === 'string' ? params.requestId : undefined;
        const request = requestId ? requests.get(requestId) : undefined;
        pushBounded(failedNetworkRequests, {
          url: boundedNullableText(request?.url ?? null),
          method: request?.method ?? null,
          status: null,
          errorText: boundedNullableText(stringValue(params.errorText)),
        });
        if (requestId) requests.delete(requestId);
        return;
      }

      if (method === 'Network.loadingFinished') {
        if (typeof params.requestId === 'string') requests.delete(params.requestId);
        return;
      }

      if (method === 'Runtime.consoleAPICalled' && params.type === 'error') {
        const args = Array.isArray(params.args) ? params.args : [];
        pushBounded(
          consoleErrors,
          boundedText(args.map(formatRemoteObject).join(' ') || 'console.error'),
        );
        return;
      }

      if (method === 'Runtime.exceptionThrown') {
        const details = recordValue(params.exceptionDetails);
        const exception = recordValue(details?.exception);
        pushBounded(
          consoleErrors,
          boundedText(
            stringValue(exception?.description) ?? stringValue(details?.text) ??
              'runtime exception',
          ),
        );
        return;
      }

      if (method === 'Log.entryAdded') {
        const entry = recordValue(params.entry);
        if (entry?.level === 'error') {
          pushBounded(consoleErrors, boundedText(stringValue(entry.text) ?? 'browser log error'));
        }
      }
    },
    snapshot() {
      return {
        documentHttpStatus,
        documentUrl,
        consoleErrors: [...consoleErrors],
        failedNetworkRequests: [...failedNetworkRequests],
      };
    },
  };
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatRemoteObject(value: unknown): string {
  const remote = recordValue(value);
  if (!remote) return String(value);
  if (typeof remote.value === 'string') return remote.value;
  if (remote.value !== undefined) return JSON.stringify(remote.value);
  return stringValue(remote.description) ?? stringValue(remote.className) ?? 'console value';
}

function boundedText(value: string): string {
  return value.length > TEXT_LIMIT ? `${value.slice(0, TEXT_LIMIT)}…` : value;
}

function boundedNullableText(value: string | null): string | null {
  return value === null ? null : boundedText(value);
}

function pushBounded<T>(entries: T[], entry: T): void {
  entries.push(entry);
  if (entries.length > EVENT_LIMIT) entries.shift();
}
