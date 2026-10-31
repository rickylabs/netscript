import { KV_BACKGROUND_RUNTIME_RESOURCES } from '../../../../domain/cli-surface.ts';
import { readBoundedBody } from '../../../../domain/http-contract.ts';

/** Collect bounded child endpoint evidence before the failed suite cleans up its AppHost. */
export async function diagnosePluginHealth(appHost: string): Promise<void> {
  const describe = await new Deno.Command('aspire', {
    args: ['describe', '--apphost', appHost, '--format', 'Json', '--non-interactive', '--nologo'],
    stdout: 'piped',
    stderr: 'null',
    signal: AbortSignal.timeout(5_000),
  }).output();
  if (!describe.success) return;
  const topology = JSON.parse(new TextDecoder().decode(describe.stdout));
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
        const body = await readBoundedBody(response, 4096);
        Object.assign(evidence, { status: response.status, bodyTruncated: body.bodyTruncated });
        try {
          evidence.payload = childPayloadShape(JSON.parse(body.body));
        } catch {
          evidence.payload = 'invalid-json';
        }
      } catch (error) {
        evidence.transport = error instanceof DOMException ? error.name : 'fetch-failed';
      }
    }
    console.error('Plugin child health diagnostic: ' + JSON.stringify(evidence));
  }
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
