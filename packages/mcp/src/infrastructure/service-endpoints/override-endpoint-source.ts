import { join } from '@std/path';
import type {
  EndpointCandidate,
  EndpointSourceContext,
  EndpointSourcePort,
  SourceOutcome,
} from '../../ports/service-endpoint-directory-port.ts';
import { normalizeDiscoveredEndpointUrl } from './endpoint-url.ts';

/** Injectable filesystem boundary for the override carrier. */
export interface OverrideEndpointSourceOptions {
  /** Read one UTF-8 file. */
  readonly readText?: (path: string) => Promise<string>;
}

/** Reads explicit endpoints and exclusions from `.netscript/agent-mcp.json`. */
export class OverrideEndpointSource implements EndpointSourcePort {
  readonly #readText: (path: string) => Promise<string>;

  /** Create an override source with an optional filesystem test seam. */
  constructor(options: OverrideEndpointSourceOptions = {}) {
    this.#readText = options.readText ?? Deno.readTextFile;
  }

  /** Read only the S5-owned `introspection` subsection of the shared carrier. */
  async read(context: EndpointSourceContext, signal?: AbortSignal): Promise<SourceOutcome> {
    signal?.throwIfAborted();
    const path = join(context.projectRoot, '.netscript', 'agent-mcp.json');
    let parsed: unknown;
    try {
      parsed = JSON.parse(await this.#readText(path));
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return absent();
      return failed(error instanceof SyntaxError ? 'invalid' : 'unreadable', describe(error));
    }
    signal?.throwIfAborted();
    if (!isRecord(parsed)) return failed('invalid', 'agent-mcp.json must contain a JSON object');
    const introspection = parsed['introspection'];
    if (introspection === undefined) return absent();
    if (!isRecord(introspection)) {
      return failed('invalid', 'introspection must contain a JSON object');
    }

    const rawEndpoints = introspection['serviceEndpoints'];
    const rawExclusions = introspection['excludeServices'];
    if (rawEndpoints !== undefined && !isRecord(rawEndpoints)) {
      return failed('invalid', 'introspection.serviceEndpoints must contain a JSON object');
    }
    if (
      rawExclusions !== undefined &&
      (!Array.isArray(rawExclusions) || rawExclusions.some((name) => typeof name !== 'string'))
    ) {
      return failed('invalid', 'introspection.excludeServices must contain only service names');
    }

    const candidates: EndpointCandidate[] = [];
    for (const [name, rawUrl] of Object.entries(rawEndpoints ?? {})) {
      const baseUrl = normalizeDiscoveredEndpointUrl(rawUrl, true);
      if (!name || !baseUrl) {
        return failed('invalid', `invalid override endpoint for service ${JSON.stringify(name)}`);
      }
      candidates.push({ name, baseUrl, source: 'override', operatorTrusted: true });
    }
    const excludedServices = [...new Set((rawExclusions ?? []) as string[])].sort();
    candidates.sort((left, right) => left.name.localeCompare(right.name));
    return { source: 'override', outcome: 'used', candidates, excludedServices };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function absent(): SourceOutcome {
  return { source: 'override', outcome: 'absent', candidates: [], excludedServices: [] };
}

function failed(code: 'unreadable' | 'invalid', reason: string): SourceOutcome {
  return {
    source: 'override',
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
