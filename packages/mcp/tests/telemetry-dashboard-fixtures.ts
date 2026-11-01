import { assertEquals } from '@std/assert';
import { AspireTelemetrySnapshot } from '../src/infrastructure/telemetry/aspire-telemetry-snapshot.ts';

export const SNAPSHOT_NOW = 1_790_000_000_000;
export const DASHBOARD_TOKEN = 'fake-browser-login-token-sensitive';
export const DASHBOARD_API_KEY = 'fake-dashboard-api-key-sensitive';
export const DASHBOARD_CONFIG = 'fake-dashboard-config-sensitive';
export const FIXTURE_PROJECT = '/fixture/project';

export function otlpSpan(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    traceId: 'trace-checkout',
    spanId: 'span-checkout',
    name: 'checkout',
    kind: 2,
    startTimeUnixNano: String(BigInt(SNAPSHOT_NOW - 2000) * 1_000_000n),
    endTimeUnixNano: String(BigInt(SNAPSHOT_NOW - 1900) * 1_000_000n),
    status: { code: 1 },
    attributes: [],
    ...overrides,
  };
}

export function spanEnvelope(
  spans: readonly Record<string, unknown>[],
  totalCount: number = spans.length,
): unknown {
  return {
    data: {
      resourceSpans: [{
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: 'api' } },
            { key: 'service.version', value: { stringValue: 'api-revision-7' } },
            { key: 'Dashboard:Api:PrimaryApiKey', value: { stringValue: DASHBOARD_CONFIG } },
          ],
        },
        scopeSpans: [{ spans }],
      }],
    },
    totalCount,
    returnedCount: spans.length,
  };
}

export function logEnvelope(): unknown {
  return {
    data: {
      resourceLogs: [{
        resource: { attributes: [{ key: 'service.name', value: { stringValue: 'api' } }] },
        scopeLogs: [{
          logRecords: [{
            timeUnixNano: String(BigInt(SNAPSHOT_NOW - 1000) * 1_000_000n),
            severityText: 'ERROR',
            body: { stringValue: 'checkout failed' },
            traceId: 'trace-checkout',
            attributes: [],
          }],
        }],
      }],
    },
    totalCount: 1,
    returnedCount: 1,
  };
}

/** Actual HTTP fake of Aspire's supported authentication and telemetry snapshot API. */
export class FakeDashboard {
  readonly requests: URL[] = [];
  readonly discoveries: string[][] = [];
  spanPayload: unknown = spanEnvelope([otlpSpan()]);
  logPayload: unknown = logEnvelope();
  status = 200;
  psMode: 'bound' | 'wrong' | 'missing' | 'failed' | 'malformed' = 'bound';
  readonly #server: Deno.HttpServer<Deno.NetAddr>;
  readonly endpoint: string;

  constructor() {
    this.#server = Deno.serve(
      { hostname: '127.0.0.1', port: 0, onListen: () => {} },
      async (request) => {
        const url = new URL(request.url);
        this.requests.push(url);
        if (url.pathname.endsWith('/validateToken')) {
          assertEquals(await request.json(), { token: DASHBOARD_TOKEN });
          return Response.json({ apiKey: DASHBOARD_API_KEY, config: DASHBOARD_CONFIG });
        }
        if (request.headers.get('x-api-key') !== DASHBOARD_API_KEY) {
          return new Response('Unauthorized', { status: 401 });
        }
        if (this.status !== 200) return new Response(DASHBOARD_CONFIG, { status: this.status });
        if (
          url.searchParams.has('resource') &&
          !['api', 'api-api-1'].includes(url.searchParams.get('resource') ?? '')
        ) {
          return new Response(DASHBOARD_CONFIG, { status: 404 });
        }
        if (url.pathname.endsWith('/resources')) {
          return Response.json([{ name: 'api', instanceId: 'api-1', config: DASHBOARD_CONFIG }]);
        }
        if (url.pathname.endsWith('/logs')) return Response.json(this.logPayload);
        return Response.json(this.spanPayload);
      },
    );
    this.endpoint = `http://127.0.0.1:${this.#server.addr.port}/login?t=${DASHBOARD_TOKEN}`;
  }

  reader(options: { endpoint?: string } = {}): AspireTelemetrySnapshot {
    return new AspireTelemetrySnapshot({
      projectRoot: FIXTURE_PROJECT,
      ...options,
      execute: (_command, args, signal) => {
        signal?.throwIfAborted();
        this.discoveries.push([...args]);
        return Promise.resolve({
          code: this.psMode === 'failed' ? 1 : 0,
          stderr: DASHBOARD_API_KEY + DASHBOARD_CONFIG,
          stdout: this.psMode === 'malformed' ? DASHBOARD_CONFIG : JSON.stringify(
            this.psMode === 'missing' ? [] : [{
              appHostPath: this.psMode === 'wrong'
                ? '/fixture/other/aspire/apphost.mts'
                : `${FIXTURE_PROJECT}/aspire/apphost.mts`,
              status: 'running',
              dashboardUrl: this.endpoint,
              config: DASHBOARD_CONFIG,
            }],
          ),
        });
      },
    });
  }

  async close(): Promise<void> {
    await this.#server.shutdown();
  }
}
