import { join } from '@std/path';
import type { ProcessPort } from '../../ports/process-port.ts';
import { resolvePluginImportSpecifier } from '../../application/plugin/configured-plugin-specifier.ts';
import {
  CONFIGURED_PLUGIN_PROBE_SCHEMA_VERSION,
  parseResolvedConfiguredPluginManifestPayload,
  type ResolvedConfiguredPluginManifestPayload,
} from './configured-plugin-manifest-summary.ts';

const PROBE_RESULT_PREFIX = 'NETSCRIPT_PLUGIN_MANIFEST_PROBE=';
const DEFAULT_TIMEOUT_MS = 3_000;
const CHILD_PROBE = new URL('./configured-plugin-manifest-probe-child.ts', import.meta.url).href;

/** Recoverable outcomes from loading one configured plugin module in isolation. */
export type ConfiguredPluginManifestProbeResult =
  | ResolvedConfiguredPluginManifestPayload
  | { readonly status: 'missing' }
  | { readonly status: 'ambiguous'; readonly count: number }
  | { readonly status: 'import-failure'; readonly message: string }
  | { readonly status: 'malformed-payload'; readonly message: string }
  | { readonly status: 'non-zero'; readonly code: number; readonly message: string }
  | { readonly status: 'timeout'; readonly timeoutMs: number };

/** Load and inspect a configured plugin module in a bounded child process. */
export async function probeConfiguredPluginManifest(
  projectRoot: string,
  spec: string,
  process: ProcessPort,
  options: {
    readonly timeoutMs?: number;
    readonly denoCommand?: string;
    readonly childSpecifier?: string;
  } = {},
): Promise<ConfiguredPluginManifestProbeResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const args = ['run', '--no-check', '--allow-all', '--minimum-dependency-age=0'];
  const denoConfig = join(projectRoot, 'deno.json');
  if (await fileExists(denoConfig)) args.push('--config', denoConfig);
  args.push(
    options.childSpecifier ?? CHILD_PROBE,
    resolvePluginImportSpecifier(projectRoot, spec),
  );

  const result = await process.exec(options.denoCommand ?? 'deno', args, {
    cwd: projectRoot,
    timeoutMs,
  });
  if (result.timedOut) return { status: 'timeout', timeoutMs };

  const payload = readProbePayload(result.stdout);
  if (payload?.status === 'malformed-payload') return payload;
  if (payload?.status === 'resolved' && result.code === 0) return payload;
  if (payload?.status === 'import-failure') return payload;
  if (payload?.status === 'missing') return payload;
  if (payload?.status === 'ambiguous') return payload;
  if (result.code === 0) {
    return {
      status: 'malformed-payload',
      message: 'Configured plugin probe returned no valid versioned payload.',
    };
  }
  return {
    status: 'non-zero',
    code: result.code,
    message: result.stderr.trim() || result.stdout.trim() || 'no diagnostics',
  };
}

async function fileExists(path: string): Promise<boolean> {
  try {
    return (await Deno.stat(path)).isFile;
  } catch {
    return false;
  }
}

function readProbePayload(stdout: string): ConfiguredPluginManifestProbeResult | undefined {
  const line = stdout.split('\n').findLast((candidate) => candidate.startsWith(PROBE_RESULT_PREFIX));
  if (!line) return undefined;
  let value: unknown;
  try {
    value = JSON.parse(line.slice(PROBE_RESULT_PREFIX.length));
  } catch (error) {
    return {
      status: 'malformed-payload',
      message: error instanceof Error ? error.message : String(error),
    };
  }
  const resolved = parseResolvedConfiguredPluginManifestPayload(value);
  if (resolved) return resolved;
  if (!value || typeof value !== 'object') {
    return { status: 'malformed-payload', message: 'Probe payload is not an object.' };
  }
  if (Reflect.get(value, 'schemaVersion') !== CONFIGURED_PLUGIN_PROBE_SCHEMA_VERSION) {
    return { status: 'malformed-payload', message: 'Probe payload has an unsupported schema version.' };
  }
  const status = Reflect.get(value, 'status');
  if (status === 'missing') return { status };
  if (status === 'ambiguous') {
    const count = Reflect.get(value, 'count');
    return typeof count === 'number'
      ? { status, count }
      : { status: 'malformed-payload', message: 'Ambiguous probe payload has no numeric count.' };
  }
  if (status === 'import-failure') {
    const message = Reflect.get(value, 'message');
    return typeof message === 'string'
      ? { status, message }
      : { status: 'malformed-payload', message: 'Import-failure payload has no message.' };
  }
  return { status: 'malformed-payload', message: 'Probe payload has an unsupported status.' };
}
