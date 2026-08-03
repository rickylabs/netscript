import { join } from '@std/path';
import type {
  EndpointCandidate,
  EndpointSourceContext,
  EndpointSourcePort,
  SourceOutcome,
} from '../domain/service-endpoint-directory-port.ts';

/** Injectable filesystem boundary for appsettings discovery. */
export interface AppsettingsEndpointSourceOptions {
  /** Read one UTF-8 file. */
  readonly readText?: (path: string) => Promise<string>;
}

/** Reads configured services and optional pinned ports from `aspire/appsettings.json`. */
export class AppsettingsEndpointSource implements EndpointSourcePort {
  readonly #readText: (path: string) => Promise<string>;

  /** Create an appsettings source with an optional filesystem test seam. */
  constructor(options: AppsettingsEndpointSourceOptions = {}) {
    this.#readText = options.readText ?? Deno.readTextFile;
  }

  /** Preserve configured services even when Aspire will allocate their ports later. */
  async read(context: EndpointSourceContext, signal?: AbortSignal): Promise<SourceOutcome> {
    signal?.throwIfAborted();
    const path = join(context.projectRoot, 'aspire', 'appsettings.json');
    let parsed: unknown;
    try {
      parsed = JSON.parse(await this.#readText(path));
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return absent();
      return failed(error instanceof SyntaxError ? 'invalid' : 'unreadable', describe(error));
    }
    signal?.throwIfAborted();
    if (!isRecord(parsed)) return failed('invalid', 'appsettings.json must contain a JSON object');
    const netScript = parsed['NetScript'];
    const services = isRecord(netScript) ? netScript['Services'] : undefined;
    if (!isRecord(services)) {
      return failed('invalid', 'appsettings.json must contain NetScript.Services');
    }

    const candidates: EndpointCandidate[] = [];
    for (const [name, rawEntry] of Object.entries(services)) {
      if (!isRecord(rawEntry)) {
        return failed('invalid', `NetScript.Services.${name} must contain a JSON object`);
      }
      const rawPort = rawEntry['HostPort'] ?? rawEntry['Port'];
      if (rawPort !== undefined && !validPort(rawPort)) {
        return failed('invalid', `NetScript.Services.${name} declares an invalid host port`);
      }
      candidates.push({
        name,
        ...(rawPort === undefined ? {} : { baseUrl: `http://127.0.0.1:${rawPort}` }),
        source: 'appsettings',
        operatorTrusted: false,
      });
    }
    candidates.sort((left, right) => left.name.localeCompare(right.name));
    return { source: 'appsettings', outcome: 'used', candidates, excludedServices: [] };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validPort(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 65_535;
}

function absent(): SourceOutcome {
  return { source: 'appsettings', outcome: 'absent', candidates: [], excludedServices: [] };
}

function failed(code: 'unreadable' | 'invalid', reason: string): SourceOutcome {
  return {
    source: 'appsettings',
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
