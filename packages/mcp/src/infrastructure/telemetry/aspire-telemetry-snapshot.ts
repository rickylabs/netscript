import { resolve } from '@std/path';
import { createTelemetryQuery } from '@netscript/telemetry/query';
import type { TelemetrySnapshotPort } from '../../ports/telemetry-snapshot-port.ts';
import {
  TELEMETRY_SAMPLE_LIMIT,
  type TelemetrySnapshot,
  type TelemetrySnapshotFailure,
  type TelemetrySnapshotRequest,
} from '../../domain/telemetry/telemetry-snapshot.ts';
import {
  emptyTelemetryProvenance,
  telemetryUnavailable,
} from '../../domain/telemetry/telemetry-diagnostics.ts';
import { MCP_PACKAGE_VERSION } from '../../publish-assets.generated.ts';
import { AspirePsDashboardReader } from '../aspire-ps-dashboard-reader.ts';
import { extractAspireJson, isAspireRecord } from '../service-endpoints/aspire-cli-output.ts';
import { executeAspireCliCommand } from '../service-endpoints/aspire-cli-command.ts';
import { openAspireDashboardConnection } from './telemetry-query-adapter.ts';
import { isRecord } from '../../domain/schema.ts';
import {
  DashboardApiError,
  dashboardApiHeaders,
  readDashboardJson,
  validateDashboardEnvelope,
} from './dashboard-telemetry-api.ts';

/** Runtime edges for a project-bound dashboard read, replaceable without running an AppHost. */
export interface AspireTelemetrySnapshotOptions {
  /** Project whose conventional Aspire AppHost is selected exactly. */
  readonly projectRoot: string;
  /** Explicit dashboard override; login token stays private to the adapter. */
  readonly endpoint?: string;
  /** Optional configured Aspire dashboard port, treated as an explicit override. */
  readonly dashboardPort?: string;
  /** Existing cancellable Aspire process edge. */
  readonly execute?: typeof executeAspireCliCommand;
  /** HTTP edge for embedding and fake dashboard tests. */
  readonly fetch?: typeof fetch;
}

/** Read raw supported dashboard snapshots after one exact-project discovery, with no polling. */
export class AspireTelemetrySnapshot implements TelemetrySnapshotPort {
  readonly #options: AspireTelemetrySnapshotOptions;

  /** Configure IO collaborators; discovery deliberately waits until each tool call. */
  constructor(options: AspireTelemetrySnapshotOptions) {
    this.#options = options;
  }

  /** Acquire one authenticated, validated snapshot; no lookup failure becomes measured zero. */
  async readSnapshot(
    request: TelemetrySnapshotRequest,
    callerSignal: AbortSignal,
  ): Promise<TelemetrySnapshot | TelemetrySnapshotFailure> {
    const controller = new AbortController();
    const signal = AbortSignal.any([callerSignal, controller.signal]);
    const provenance = emptyTelemetryProvenance(request, MCP_PACKAGE_VERSION);
    const limit = request.limit ?? TELEMETRY_SAMPLE_LIMIT;
    let connection: ReturnType<typeof openAspireDashboardConnection> | undefined;
    try {
      signal.throwIfAborted();
      if (
        !Number.isFinite(request.sinceUnixMs) || !Number.isFinite(request.untilUnixMs) ||
        request.sinceUnixMs > request.untilUnixMs
      ) throw new Error('Invalid window');
      if (!Number.isInteger(limit) || limit < 1 || limit > TELEMETRY_SAMPLE_LIMIT) {
        throw new Error('Invalid limit');
      }
      const dashboard = await this.#dashboard(signal);
      if (!dashboard) {
        return {
          ok: false,
          code: 'telemetry_unbound',
          message: 'No running AppHost matches the selected project. Set --project-root to the ' +
            'project containing aspire/apphost.mts, start that AppHost, and confirm it with ' +
            'aspire ps. An explicit telemetry dashboard endpoint can also be configured. ' +
            'No performance measurements are available.',
          provenance: { ...provenance, state: 'unbound' },
        };
      }
      connection = openAspireDashboardConnection(dashboard.origin, { fetch: this.#options.fetch });
      const headers = await dashboardApiHeaders(dashboard, connection.fetch, signal);
      const secrets = [...dashboard.searchParams.values(), headers.get('x-api-key') ?? '']
        .filter((value) => value.length > 0);
      const read = (kind: string): Promise<unknown> => {
        const url = new URL(`/api/telemetry/${kind}`, dashboard.origin);
        if (kind !== 'resources') {
          url.searchParams.set('limit', String(limit));
          if (request.service) url.searchParams.set('resource', request.service);
        }
        return readDashboardJson(connection!.fetch, url, signal, { headers });
      };
      const reads = [
        read('spans'),
        request.includeHealth ? read('logs') : Promise.resolve(undefined),
        request.includeHealth ? read('resources') : Promise.resolve([]),
      ];
      let payloadsRead: unknown[];
      try {
        payloadsRead = await Promise.all(reads);
      } catch (error) {
        controller.abort();
        await Promise.allSettled(reads);
        throw error;
      }
      const [spanPayload, logPayload, resourcePayload] = payloadsRead;
      const spanEnvelope = validateDashboardEnvelope(spanPayload, 'spans');
      const logEnvelope = request.includeHealth
        ? validateDashboardEnvelope(logPayload, 'logs')
        : undefined;
      if (
        !Array.isArray(resourcePayload) || resourcePayload.length > TELEMETRY_SAMPLE_LIMIT ||
        resourcePayload.some((value) =>
          !isRecord(value) || typeof value.name !== 'string' || !value.name
        )
      ) {
        throw new Error('Invalid resource list');
      }
      // Normalize only validated, already acquired data. The shared reader's forgiving HTTP path
      // cannot turn failed network/auth/JSON reads into empty results at this boundary.
      const payloads: Record<string, unknown> = {
        spans: spanPayload,
        logs: logPayload,
        resources: resourcePayload,
      };
      const query = createTelemetryQuery({
        endpoint: dashboard.origin,
        fetch: (input) =>
          Promise.resolve(
            Response.json(payloads[new URL(String(input)).pathname.split('/').at(-1)!]),
          ),
      });
      const [allSpans, allLogs, allResources] = await Promise.all([
        query.querySpans(),
        request.includeHealth ? query.queryLogs() : Promise.resolve([]),
        request.includeHealth ? query.queryResources() : Promise.resolve([]),
      ]);
      if (
        allSpans.length !== spanEnvelope.returnedCount ||
        (logEnvelope && allLogs.length !== logEnvelope.returnedCount) ||
        allResources.length !== resourcePayload.length
      ) throw new Error('Normalization lost records');
      const inWindow = (time: number) => time >= request.sinceUnixMs && time <= request.untilUnixMs;
      const spans = allSpans.filter((span) => inWindow(span.startTimeUnixMs));
      const logs = allLogs.filter((log) => inWindow(log.timeUnixMs));
      const sourceTruncated = [spanEnvelope, ...(logEnvelope ? [logEnvelope] : [])].some((entry) =>
        entry.totalCount > entry.returnedCount || entry.returnedCount === limit
      );
      const times = allSpans.map((span) => span.startTimeUnixMs);
      const resources = request.service
        ? allResources.filter((resource) =>
          resource.serviceName === request.service ||
          (resource.serviceInstanceId !== undefined &&
            `${resource.serviceName}-${resource.serviceInstanceId}` === request.service)
        )
        : allResources;
      const serviceRevisions = [
        ...new Set(
          [...spans, ...logs, ...resources].flatMap((item) => {
            const revision = item.attributes['service.version'];
            return typeof revision === 'string' ? [redact(revision, secrets).slice(0, 120)] : [];
          }),
        ),
      ].slice(0, 20);
      return {
        ok: true,
        spans: spans.map((span) => ({
          ...span,
          name: redact(span.name, secrets),
          attributes: redactAttributes(span.attributes, secrets),
        })),
        logs,
        resources,
        provenance: {
          ...provenance,
          state: sourceTruncated ? 'partial' : spans.length || logs.length ? 'ready' : 'no_data',
          sampleCount: spans.length,
          logCount: request.includeHealth ? logs.length : null,
          serviceRevisions,
          sourceTruncated,
          observedRange: times.length
            ? { sinceUnixMs: Math.min(...times), untilUnixMs: Math.max(...times) }
            : null,
          totalCount: spanEnvelope.totalCount,
          returnedCount: spanEnvelope.returnedCount,
        },
      };
    } catch (error) {
      if (
        error instanceof DashboardApiError && error.status === 404 &&
        error.resourceLookup && request.service
      ) {
        return {
          ok: false,
          code: 'telemetry_unknown_service',
          message: 'The service filter did not match exactly one dashboard telemetry resource. ' +
            'Check the service or replica name in aspire otel traces, ensure that it has sent ' +
            'telemetry, and verify that the selected dashboard telemetry API is enabled. ' +
            'No performance measurements are available.',
          provenance,
        };
      }
      return telemetryUnavailable(provenance);
    } finally {
      controller.abort();
      connection?.close();
    }
  }

  async #dashboard(signal: AbortSignal): Promise<URL | undefined> {
    let endpoint = this.#options.endpoint;
    if (endpoint === undefined && this.#options.dashboardPort !== undefined) {
      const port = this.#options.dashboardPort.trim();
      if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
        throw new Error('Invalid configured dashboard port');
      }
      endpoint = `http://localhost:${port}`;
    }
    if (endpoint === undefined) {
      const result = await (this.#options.execute ?? executeAspireCliCommand)(
        'aspire',
        ['ps', '--format', 'Json', '--nologo', '--non-interactive'],
        signal,
      );
      if (result.code !== 0) throw new Error('Aspire discovery failed');
      const discovered: unknown = JSON.parse(extractAspireJson(result.stdout));
      if (!Array.isArray(discovered) || discovered.some((value) => !isAspireRecord(value))) {
        throw new Error('Invalid Aspire discovery response');
      }
      // Existing path canonicalization/selection is reused after asynchronous command capture.
      endpoint = new AspirePsDashboardReader({
        appHostPath: resolve(this.#options.projectRoot, 'aspire', 'apphost.mts'),
        execute: () => result,
      }).readDashboardUrl();
      if (endpoint === undefined) return undefined;
    }
    const url = new URL(endpoint);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new Error('Invalid dashboard URL');
    }
    return url;
  }
}

function redact(value: string, secrets: readonly string[]): string {
  for (const secret of secrets) value = value.replaceAll(secret, '[redacted]');
  return value;
}

function redactAttributes(
  attributes: Readonly<Record<string, string | number | boolean>>,
  secrets: readonly string[],
): Readonly<Record<string, string | number | boolean>> {
  return Object.fromEntries(
    Object.entries(attributes).map((
      [key, value],
    ) => [key, typeof value === 'string' ? redact(value, secrets) : value]),
  );
}
