import { StreamProducerMetricNames } from '@netscript/plugin-streams-core/telemetry';
import type { TelemetryTrace } from '@netscript/telemetry/query';
import { createLiveAspireTelemetryQuery } from './aspire-dashboard-telemetry.ts';

// This coordinator is copied into service-only smoke workspaces where the streams plugin source is
// intentionally absent. Keep the probe's wire markers structural so static scaffold checks do not
// acquire a source dependency on an uninstalled plugin tree.
const PRODUCER_BACKOFF_MARKER = 'NETSCRIPT_PRODUCER_RECONNECT_BACKOFF';
const PRODUCER_RESULT_MARKER = 'NETSCRIPT_PRODUCER_RECONNECT_RESULT';

interface ProducerReconnectProbeResult {
  readonly traceId: string;
  readonly streamPath: string;
  readonly producerId: string;
  readonly keys: readonly string[];
  readonly sinceUnixMs: number;
}

const PROBE_TIMEOUT_MS = 90_000;
const TELEMETRY_ATTEMPTS = 30;
const TELEMETRY_DELAY_MS = 500;
const SERVICE_NAME = 'streams-producer-reconnect-probe';

/** Parse the probe's single structured result line. */
export function parseProducerReconnectResult(output: string): ProducerReconnectProbeResult {
  const line = output.split(/\r?\n/).find((candidate) =>
    candidate.startsWith(`${PRODUCER_RESULT_MARKER} `)
  );
  if (!line) throw new Error('Producer reconnect probe did not emit its result marker');
  const value: unknown = JSON.parse(line.slice(PRODUCER_RESULT_MARKER.length + 1));
  if (
    !isRecord(value) || typeof value.traceId !== 'string' ||
    typeof value.streamPath !== 'string' || typeof value.producerId !== 'string' ||
    typeof value.sinceUnixMs !== 'number' || !Array.isArray(value.keys) ||
    !value.keys.every((key) => typeof key === 'string')
  ) {
    throw new Error('Producer reconnect probe result had an invalid shape');
  }
  return {
    traceId: value.traceId,
    streamPath: value.streamPath,
    producerId: value.producerId,
    keys: value.keys,
    sinceUnixMs: value.sinceUnixMs,
  };
}

/** Assert the required lifecycle events belong to one recovered publish trace. */
export function assertProducerReconnectTrace(
  traces: readonly TelemetryTrace[],
  expected: ProducerReconnectProbeResult,
): void {
  const trace = traces.find((candidate) => candidate.traceId === expected.traceId);
  const span = trace?.spans.find((candidate) =>
    candidate.name === 'stream.publish' &&
    candidate.attributes['netscript.stream.producer.id'] === expected.producerId
  );
  if (!span) throw new Error(`Recovered publish trace ${expected.traceId} was not found`);
  const events = new Set(span.events.map((event) => event.name));
  for (
    const required of [
      'stream.producer.buffered',
      'stream.producer.retry',
      'stream.producer.recovered',
      'stream.producer.settled',
    ]
  ) {
    if (!events.has(required)) {
      throw new Error(`Recovered publish trace ${expected.traceId} omitted ${required}`);
    }
  }
  if (span.attributes['netscript.outcome'] !== 'delivered') {
    throw new Error(`Recovered publish trace ${expected.traceId} was not delivered`);
  }
}

/** Assert retry, recovery, and receipt-delivery metric values for this producer. */
export function assertProducerReconnectMetrics(
  payloads: readonly unknown[],
  expected: ProducerReconnectProbeResult,
): void {
  for (
    const name of [
      StreamProducerMetricNames.RETRIES,
      StreamProducerMetricNames.RECOVERIES,
      StreamProducerMetricNames.WRITES_DELIVERED,
    ]
  ) {
    const value = otlpMetricPoints(payloads, name)
      .filter((point) =>
        point.attributes['netscript.stream.producer.id'] === expected.producerId &&
        point.attributes['netscript.stream.path'] === expected.streamPath
      )
      .reduce((sum, point) => sum + point.value, 0);
    if (value <= 0) throw new Error(`Reconnect metric ${name} had no positive probe value`);
  }
}

async function main(): Promise<void> {
  const [projectRoot, appHost, repoRoot, baseUrl] = Deno.args;
  if (!projectRoot || !appHost || !repoRoot || !baseUrl) {
    throw new Error('project root, AppHost, repository root, and streams base URL are required');
  }
  const metadata = await readStartMetadata(projectRoot);
  const otlpEndpoint = await readOtlpEndpoint(metadata.logFile);
  let streamsStarted = true;
  let child: Deno.ChildProcess | undefined;
  let otlpCapture: OtlpCapture | undefined;

  try {
    await runAspireResource(appHost, 'stop');
    streamsStarted = false;
    await waitForStreamsOffline(baseUrl);
    otlpCapture = startOtlpCapture(otlpEndpoint);

    child = new Deno.Command('deno', {
      args: [
        'run',
        '--allow-all',
        `${repoRoot}/plugins/streams/src/e2e/probes/producer-reconnect.ts`,
        baseUrl,
      ],
      cwd: repoRoot,
      env: {
        OTEL_DENO: 'true',
        OTEL_DENO_CONSOLE: 'ignore',
        OTEL_EXPORTER_OTLP_ENDPOINT: otlpCapture.endpoint,
        OTEL_EXPORTER_OTLP_PROTOCOL: 'http/json',
        OTEL_METRIC_EXPORT_INTERVAL: '100',
        OTEL_SERVICE_NAME: SERVICE_NAME,
      },
      stdout: 'piped',
      stderr: 'piped',
    }).spawn();
    const stdout = collectStream(child.stdout);
    const stderr = collectStream(child.stderr);
    const markerFound = await waitForOutputMarker(
      stdout.observed,
      PRODUCER_BACKOFF_MARKER,
      PROBE_TIMEOUT_MS,
    );
    if (!markerFound) {
      const status = await child.status;
      const [stdoutText, stderrText] = await Promise.all([stdout.completed, stderr.completed]);
      throw new Error(
        `Producer reconnect probe exited with code ${status.code} before its backoff marker: ${
          stderrText || stdoutText
        }`,
      );
    }
    console.info(`Observed ${PRODUCER_BACKOFF_MARKER}; restarting exact Aspire resource streams.`);

    await runAspireResource(appHost, 'start');
    streamsStarted = true;
    await waitForStreamsHealthy(appHost);

    const status = await child.status;
    const [stdoutText, stderrText] = await Promise.all([stdout.completed, stderr.completed]);
    if (!status.success) {
      throw new Error(
        `Producer reconnect probe failed with code ${status.code}: ${stderrText || stdoutText}`,
      );
    }
    const result = parseProducerReconnectResult(stdoutText);
    const query = await createLiveAspireTelemetryQuery(projectRoot);
    await waitForTelemetry(query, otlpCapture.metricPayloads, result);
    console.info(
      `Producer reconnect recovered FIFO ${
        result.keys.join(' -> ')
      } and preserved trace ${result.traceId} with retry/recovery/delivery metrics.`,
    );
  } finally {
    if (!streamsStarted) {
      await runAspireResource(appHost, 'start').catch((error) =>
        console.error(`Failed to restore streams resource after reconnect gate: ${String(error)}`)
      );
    }
    if (child) {
      try {
        child.kill('SIGTERM');
      } catch {
        // The probe already exited; its verdict was handled above.
      }
      await child.status.catch(() => undefined);
    }
    await otlpCapture?.shutdown();
  }
}

interface OtlpCapture {
  readonly endpoint: string;
  readonly metricPayloads: readonly unknown[];
  shutdown(): Promise<void>;
}

function startOtlpCapture(upstreamEndpoint: string): OtlpCapture {
  const metricPayloads: unknown[] = [];
  const abort = new AbortController();
  const server = Deno.serve({
    hostname: '127.0.0.1',
    port: 0,
    signal: abort.signal,
    onListen: () => undefined,
  }, async (request) => {
    const url = new URL(request.url);
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (url.pathname === '/v1/metrics') {
      const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
      metricPayloads.push(payload);
    }
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('content-length');
    return await fetch(`${upstreamEndpoint.replace(/\/$/, '')}${url.pathname}`, {
      method: request.method,
      headers,
      body: bytes,
    });
  });
  const address = server.addr;
  if (address.transport !== 'tcp') throw new Error('OTLP capture did not bind a TCP endpoint');
  return {
    endpoint: `http://127.0.0.1:${address.port}`,
    metricPayloads,
    shutdown: () => {
      server.unref();
      abort.abort();
      void server.finished.catch(() => undefined);
      return Promise.resolve();
    },
  };
}

interface ObservedStream {
  readonly observed: ReadableStream<string>;
  readonly completed: Promise<string>;
}

function collectStream(stream: ReadableStream<Uint8Array>): ObservedStream {
  let controller: ReadableStreamDefaultController<string> | undefined;
  const observed = new ReadableStream<string>({
    start(value) {
      controller = value;
    },
  });
  const completed = (async () => {
    let text = '';
    const decoder = new TextDecoder();
    for await (const chunk of stream) {
      text += decoder.decode(chunk, { stream: true });
      controller?.enqueue(text);
    }
    text += decoder.decode();
    controller?.close();
    return text;
  })();
  return { observed, completed };
}

async function waitForOutputMarker(
  stream: ReadableStream<string>,
  marker: string,
  timeoutMs: number,
): Promise<boolean> {
  const reader = stream.getReader();
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`Timed out waiting for ${marker}`)),
      timeoutMs,
    );
  });
  try {
    while (true) {
      const result = await Promise.race([reader.read(), timeout]);
      if (result.done) return false;
      if (result.value.includes(marker)) return true;
    }
  } finally {
    clearTimeout(timeoutId);
    reader.releaseLock();
  }
}

async function waitForTelemetry(
  query: Awaited<ReturnType<typeof createLiveAspireTelemetryQuery>>,
  metricPayloads: readonly unknown[],
  result: ProducerReconnectProbeResult,
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= TELEMETRY_ATTEMPTS; attempt++) {
    try {
      const traces = await query.queryTraces({
        serviceName: SERVICE_NAME,
        sinceUnixMs: result.sinceUnixMs,
      });
      assertProducerReconnectTrace(traces, result);
      assertProducerReconnectMetrics(metricPayloads, result);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < TELEMETRY_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, TELEMETRY_DELAY_MS));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

interface OtlpMetricPoint {
  readonly value: number;
  readonly attributes: Readonly<Record<string, string | number | boolean>>;
}

function otlpMetricPoints(payloads: readonly unknown[], metricName: string): OtlpMetricPoint[] {
  const points: OtlpMetricPoint[] = [];
  visitRecords(payloads, (record) => {
    if (record.name !== metricName) return;
    for (const data of Object.values(record)) {
      if (!isRecord(data) || !Array.isArray(data.dataPoints)) continue;
      for (const point of data.dataPoints) {
        if (!isRecord(point)) continue;
        const value = otlpNumber(point.asInt ?? point.asDouble ?? point.value);
        if (value === undefined) continue;
        points.push({
          value,
          attributes: otlpAttributes(point.attributes),
        });
      }
    }
  });
  return points;
}

function visitRecords(value: unknown, inspect: (record: Record<string, unknown>) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) visitRecords(item, inspect);
    return;
  }
  if (!isRecord(value)) return;
  inspect(value);
  for (const child of Object.values(value)) visitRecords(child, inspect);
}

function otlpAttributes(value: unknown): Record<string, string | number | boolean> {
  const attributes: Record<string, string | number | boolean> = {};
  if (!Array.isArray(value)) return attributes;
  for (const item of value) {
    if (!isRecord(item) || typeof item.key !== 'string' || !isRecord(item.value)) continue;
    const attribute = item.value.stringValue ?? item.value.intValue ??
      item.value.doubleValue ?? item.value.boolValue;
    if (typeof attribute === 'string' || typeof attribute === 'boolean') {
      attributes[item.key] = attribute;
    } else if (typeof attribute === 'number') {
      attributes[item.key] = attribute;
    }
  }
  return attributes;
}

function otlpNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function runAspireResource(appHost: string, command: 'start' | 'stop'): Promise<void> {
  const output = await new Deno.Command('aspire', {
    args: [
      'resource',
      'streams',
      command,
      '--apphost',
      appHost,
      '--non-interactive',
      '--nologo',
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!output.success) {
    throw new Error(
      `aspire resource streams ${command} failed with code ${output.code}: ${
        decode(output.stderr) || decode(output.stdout)
      }`,
    );
  }
}

async function waitForStreamsHealthy(appHost: string): Promise<void> {
  const output = await new Deno.Command('aspire', {
    args: [
      'wait',
      'streams',
      '--status',
      'healthy',
      '--timeout',
      '120',
      '--apphost',
      appHost,
      '--non-interactive',
      '--nologo',
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!output.success) {
    throw new Error(
      `aspire wait streams failed with code ${output.code}: ${
        decode(output.stderr) || decode(output.stdout)
      }`,
    );
  }
}

async function waitForStreamsOffline(baseUrl: string): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(500) });
    } catch {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('streams resource remained reachable after Aspire stop');
}

async function readStartMetadata(
  projectRoot: string,
): Promise<Readonly<{ logFile: string }>> {
  const value: unknown = JSON.parse(
    await Deno.readTextFile(`${projectRoot}/.netscript/e2e/aspire-start.json`),
  );
  if (!isRecord(value) || typeof value.logFile !== 'string') {
    throw new Error('Aspire start metadata did not contain logFile');
  }
  return { logFile: value.logFile };
}

async function readOtlpEndpoint(logFile: string): Promise<string> {
  const logText = await Deno.readTextFile(logFile);
  const endpoints = [...logText.matchAll(/OTLP\/HTTP:\s+(https?:\/\/\S+)/g)];
  const endpoint = endpoints.at(-1)?.[1];
  if (!endpoint) throw new Error('Aspire OTLP/HTTP endpoint was not found');
  return endpoint;
}

function decode(value: Uint8Array): string {
  return new TextDecoder().decode(value).trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

if (import.meta.main) await main();
