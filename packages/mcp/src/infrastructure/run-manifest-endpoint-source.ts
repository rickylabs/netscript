import { join } from '@std/path';
import type {
  EndpointCandidate,
  EndpointSourceContext,
  EndpointSourcePort,
  SourceFailureCode,
  SourceOutcome,
} from '../domain/service-endpoint-directory-port.ts';
import { normalizeDiscoveredEndpointUrl } from '../domain/service-endpoint-url.ts';

/** Injectable filesystem boundary for identity-bound manifest discovery. */
export interface RunManifestEndpointSourceOptions {
  /** Read one UTF-8 file. */
  readonly readText?: (path: string) => Promise<string>;
  /** Resolve one path through filesystem links. */
  readonly realPath?: (path: string) => Promise<string>;
}

/** Reads identity-bound endpoints from `.netscript/run/endpoints.json`. */
export class RunManifestEndpointSource implements EndpointSourcePort {
  readonly #readText: (path: string) => Promise<string>;
  readonly #realPath: (path: string) => Promise<string>;

  /** Create a manifest source with optional filesystem test seams. */
  constructor(options: RunManifestEndpointSourceOptions = {}) {
    this.#readText = options.readText ?? Deno.readTextFile;
    this.#realPath = options.realPath ?? Deno.realPath;
  }

  /** Require real-path project identity and an externally supplied current run token. */
  async read(context: EndpointSourceContext, signal?: AbortSignal): Promise<SourceOutcome> {
    signal?.throwIfAborted();
    const path = join(context.projectRoot, '.netscript', 'run', 'endpoints.json');
    let parsed: unknown;
    try {
      parsed = JSON.parse(await this.#readText(path));
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return absent();
      return failed(error instanceof SyntaxError ? 'invalid' : 'unreadable', describe(error));
    }
    if (!context.expectedRunId) {
      return failed('expected_run_id_missing', 'current AppHost runId was not supplied');
    }
    if (!isRecord(parsed)) return failed('invalid', 'endpoint manifest must contain a JSON object');
    if (typeof parsed['projectRoot'] !== 'string') {
      return failed('invalid', 'endpoint manifest projectRoot must be a string');
    }

    let actualRoot: string;
    let manifestRoot: string;
    try {
      [actualRoot, manifestRoot] = await Promise.all([
        this.#realPath(context.projectRoot),
        this.#realPath(parsed['projectRoot']),
      ]);
    } catch (error) {
      return failed(
        'project_root_mismatch',
        `project root could not be identity-bound: ${describe(error)}`,
      );
    }
    if (actualRoot !== manifestRoot) {
      return failed(
        'project_root_mismatch',
        'endpoint manifest belongs to a different project root',
      );
    }
    if (parsed['runId'] !== context.expectedRunId) {
      return failed(
        'run_id_mismatch',
        'endpoint manifest does not match the current AppHost runId',
      );
    }

    const decoded = decodeServices(parsed['services']);
    if (typeof decoded === 'string') return failed('invalid', decoded);
    signal?.throwIfAborted();
    return { source: 'run-manifest', outcome: 'used', candidates: decoded, excludedServices: [] };
  }
}

function decodeServices(value: unknown): EndpointCandidate[] | string {
  const rows: Array<{ name: string; url: unknown }> = [];
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (!isRecord(entry) || typeof entry['service'] !== 'string') {
        return 'endpoint manifest services array contains an invalid entry';
      }
      rows.push({ name: entry['service'], url: entry['url'] });
    }
  } else if (isRecord(value)) {
    for (const [name, entry] of Object.entries(value)) {
      if (!isRecord(entry)) return `endpoint manifest service ${name} must contain an object`;
      rows.push({ name, url: entry['http'] ?? entry['url'] });
    }
  } else {
    return 'endpoint manifest services must be an array or object';
  }

  const candidates: EndpointCandidate[] = [];
  for (const row of rows) {
    const baseUrl = normalizeDiscoveredEndpointUrl(row.url, false);
    if (!row.name || !baseUrl) return `endpoint manifest service ${row.name} has an invalid URL`;
    candidates.push({
      name: row.name,
      baseUrl,
      source: 'run-manifest',
      operatorTrusted: false,
    });
  }
  return candidates.sort((left, right) => left.name.localeCompare(right.name));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function absent(): SourceOutcome {
  return { source: 'run-manifest', outcome: 'absent', candidates: [], excludedServices: [] };
}

function failed(code: SourceFailureCode, reason: string): SourceOutcome {
  return {
    source: 'run-manifest',
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
