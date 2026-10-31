import { KV_BACKGROUND_RUNTIME_RESOURCES } from '../../../../domain/cli-surface.ts';
import { readBoundedBody } from '../../../../domain/http-contract.ts';
import { readDescribedResource } from '../service-env/service-env-evidence.ts';

const CHILD_CONSOLE_EVENTS = [
  ['Process started', 'process-started'],
  ['Process finished', 'process-finished'],
  ['Restarting!', 'watch-restart'],
  ['Waiting for graceful termination', 'watch-draining'],
  ['Listening on', 'http-listening'],
  ['Background child failed', 'child-failed'],
  ['Saga delivery listener stopped', 'delivery-stopped'],
  ['atomic transition', 'atomic-capability'],
  ['SagasError', 'saga-error'],
  ['TypeError', 'type-error'],
  ['ConnectionError', 'connection-error'],
  ['QueueError', 'queue-error'],
] as const;

/** Collect bounded child endpoint evidence before the failed suite cleans up its AppHost. */
export async function diagnosePluginHealth(appHost: string): Promise<void> {
  const describe = await new Deno.Command('aspire', {
    args: ['describe', '--apphost', appHost, '--format', 'Json', '--non-interactive', '--nologo'],
    stdout: 'piped',
    stderr: 'null',
    signal: AbortSignal.timeout(5_000),
  }).output();
  if (!describe.success) return;
  const source = new TextDecoder().decode(describe.stdout);
  const topology = JSON.parse(source);
  for (const name of KV_BACKGROUND_RUNTIME_RESOURCES) {
    const resource = topology.resources?.find((entry: Record<string, unknown>) =>
      (entry.displayName ?? entry.name) === name
    );
    const endpoint = resource?.urls?.find((entry: { url?: string }) =>
      entry.url && /^https?:\/\//.test(entry.url)
    )?.url;
    const evidence: Record<string, unknown> = {
      resource: name,
      state: resource?.state,
      healthStatus: resource?.healthStatus,
      endpointAvailable: !!endpoint,
    };
    if (endpoint) {
      try {
        const response = await fetch(new URL('/health', endpoint), {
          signal: AbortSignal.timeout(2_000),
          redirect: 'error',
        });
        evidence.status = response.status;
        const body = await readBoundedBody(response, 4096);
        evidence.bodyTruncated = body.bodyTruncated;
        try {
          evidence.payload = childPayloadShape(JSON.parse(body.body));
        } catch {
          evidence.payload = 'invalid-json';
        }
      } catch (error) {
        evidence.transport = error instanceof DOMException ? error.name : 'fetch-failed';
      }
    }
    if (evidence.transport) {
      const target = readDescribedResource(source, name).environment.get('PORT');
      if (target && /^\d+$/.test(target)) {
        try {
          const response = await fetch(`http://localhost:${target}/health`, {
            signal: AbortSignal.timeout(2_000),
            redirect: 'error',
          });
          evidence.directStatus = response.status;
          const body = await readBoundedBody(response, 4096);
          evidence.directPayload = childPayloadShape(JSON.parse(body.body));
        } catch (error) {
          evidence.directTransport = error instanceof DOMException ? error.name : 'fetch-failed';
        }
      }
      try {
        const logs = await new Deno.Command('aspire', {
          args: ['logs', name, '-n', '50', '--apphost', appHost, '--non-interactive', '--nologo'],
          stdout: 'piped',
          stderr: 'null',
          signal: AbortSignal.timeout(5_000),
        }).output();
        evidence.console = childConsoleEvents(new TextDecoder().decode(logs.stdout));
      } catch {
        evidence.console = 'unavailable';
      }
    }
    console.error('Plugin child health diagnostic: ' + JSON.stringify(evidence));
  }
}

/** Retain lifecycle/error categories only; console values and stack traces stay out of reports. */
export function childConsoleEvents(source: string): readonly string[] {
  return source.split(/\r?\n/).flatMap((line) => {
    return CHILD_CONSOLE_EVENTS.filter(([marker]) => line.includes(marker)).map(([, event]) =>
      event
    );
  }).slice(-50);
}

/** Describe payload fields without copying endpoint URLs, exception messages or arbitrary values. */
export function childPayloadShape(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { type: typeof value };
  const record = value as Record<string, unknown>;
  const fields = ['state', 'registryReady', 'dependencyReady', 'restartCount', 'lastFatalError'];
  return Object.fromEntries(fields.map((field) => [field, {
    present: field in record,
    type: record[field] === null ? 'null' : typeof record[field],
    ...(typeof record[field] === 'boolean' || typeof record[field] === 'number'
      ? { value: record[field] }
      : {}),
    ...(field === 'state' && ['ready', 'starting', 'degraded', 'failed', 'stopped', 'crash-looping']
        .includes(String(record[field]))
      ? { value: record[field] }
      : {}),
  }]));
}

if (import.meta.main) {
  const [appHost, command, ...args] = Deno.args;
  if (!appHost || !command) throw new Error('AppHost and doctor command are required');
  const result = await new Deno.Command(command, {
    args,
    stdin: 'null',
    stdout: 'inherit',
    stderr: 'inherit',
  }).output();
  if (!result.success) {
    try {
      await diagnosePluginHealth(appHost);
    } catch {
      console.error('Plugin child health diagnostic unavailable.');
    }
  }
  Deno.exit(result.code);
}
