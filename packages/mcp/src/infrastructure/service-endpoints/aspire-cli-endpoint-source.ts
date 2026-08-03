import { join } from '@std/path';
import type {
  EndpointCandidate,
  EndpointSourceContext,
  EndpointSourcePort,
  SourceFailureCode,
  SourceOutcome,
} from '../../ports/service-endpoint-directory-port.ts';
import { normalizeDiscoveredEndpointUrl } from './endpoint-url.ts';

/** Captured result of one Aspire CLI invocation. */
export interface AspireCliCommandResult {
  /** Process exit status. */
  readonly code: number;
  /** Captured standard output. */
  readonly stdout: string;
  /** Captured standard error. */
  readonly stderr: string;
}

/** Injectable Aspire command boundary used by the source adapter. */
export type AspireCliCommand = (
  command: string,
  args: readonly string[],
  signal?: AbortSignal,
) => Promise<AspireCliCommandResult>;

/** Options for the Aspire CLI endpoint source. */
export interface AspireCliEndpointSourceOptions {
  /** Aspire executable name or path. */
  readonly command?: string;
  /** Override the process boundary for deterministic tests. */
  readonly execute?: AspireCliCommand;
}

/** Queries the running AppHost through Aspire's machine-readable describe surface. */
export class AspireCliEndpointSource implements EndpointSourcePort {
  readonly #command: string;
  readonly #execute: AspireCliCommand;

  /** Create an Aspire source with an injectable command boundary. */
  constructor(options: AspireCliEndpointSourceOptions = {}) {
    this.#command = options.command ?? 'aspire';
    this.#execute = options.execute ?? executeCommand;
  }

  /** Report command absence, non-zero exits, and parse failures as distinct failed outcomes. */
  async read(context: EndpointSourceContext, signal?: AbortSignal): Promise<SourceOutcome> {
    signal?.throwIfAborted();
    const appHostPath = context.appHostPath ?? join(context.projectRoot, 'aspire', 'apphost.mts');
    let result: AspireCliCommandResult;
    try {
      result = await this.#execute(this.#command, [
        'describe',
        '--apphost',
        appHostPath,
        '--format',
        'Json',
        '--non-interactive',
        '--nologo',
      ], signal);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return failed('command_not_found', `Aspire CLI executable was not found: ${this.#command}`);
      }
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      return failed('command_failed', describe(error));
    }
    if (result.code !== 0) {
      const detail = (result.stderr || result.stdout).trim();
      return failed(
        'command_failed',
        `aspire describe exited ${result.code}${detail ? `: ${detail}` : ''}`,
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(result.stdout));
    } catch (error) {
      return failed('parse_failed', `aspire describe JSON could not be parsed: ${describe(error)}`);
    }
    if (!isRecord(parsed) || !Array.isArray(parsed['resources'])) {
      return failed('parse_failed', 'aspire describe output did not contain top-level resources[]');
    }

    const candidates: EndpointCandidate[] = [];
    for (const rawResource of parsed['resources']) {
      if (!isRecord(rawResource)) continue;
      const name = resourceName(rawResource);
      const baseUrl = firstHttpUrl(rawResource['urls']);
      if (!name || !baseUrl) continue;
      candidates.push({ name, baseUrl, source: 'aspire-cli', operatorTrusted: false });
    }
    candidates.sort((left, right) => left.name.localeCompare(right.name));
    return { source: 'aspire-cli', outcome: 'used', candidates, excludedServices: [] };
  }
}

async function executeCommand(
  command: string,
  args: readonly string[],
  signal?: AbortSignal,
): Promise<AspireCliCommandResult> {
  signal?.throwIfAborted();
  const child = new Deno.Command(command, {
    args: [...args],
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  let aborted = false;
  const abort = (): void => {
    aborted = true;
    try {
      child.kill('SIGTERM');
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  };
  signal?.addEventListener('abort', abort, { once: true });
  let output: Deno.CommandOutput;
  try {
    output = await child.output();
  } finally {
    signal?.removeEventListener('abort', abort);
  }
  if (aborted) throw new DOMException('Aspire CLI query was aborted', 'AbortError');
  const decoder = new TextDecoder();
  return {
    code: output.code,
    stdout: decoder.decode(output.stdout),
    stderr: decoder.decode(output.stderr),
  };
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed;
  const positions = [trimmed.indexOf('{'), trimmed.indexOf('[')].filter((index) => index >= 0);
  if (positions.length === 0) throw new SyntaxError('no JSON object or array was emitted');
  return trimmed.slice(Math.min(...positions));
}

function resourceName(resource: Record<string, unknown>): string | undefined {
  const displayName = resource['displayName'];
  if (typeof displayName === 'string' && displayName) return displayName;
  const name = resource['name'];
  if (typeof name !== 'string' || !name) return undefined;
  return name.replace(/-[a-z0-9]{8}$/i, '');
}

function firstHttpUrl(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined;
  const urls: string[] = [];
  for (const entry of value) {
    const rawUrl = isRecord(entry) ? entry['url'] : entry;
    const normalized = normalizeDiscoveredEndpointUrl(rawUrl, false);
    if (normalized) urls.push(normalized);
  }
  return urls.find((url) => url.startsWith('http://')) ?? urls[0];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function failed(code: SourceFailureCode, reason: string): SourceOutcome {
  return {
    source: 'aspire-cli',
    outcome: 'failed',
    code,
    reason,
    candidates: [],
    excludedServices: [],
  };
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
