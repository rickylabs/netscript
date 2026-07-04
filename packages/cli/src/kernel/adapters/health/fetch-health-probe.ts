/**
 * @module kernel/adapters/health/fetch-health-probe
 *
 * Bare-metal reference binding of {@link HealthProbePort} (R-DEPLOY-3): performs
 * a single HTTP GET against the resolved health URL with a per-attempt timeout,
 * reporting `healthy = (status === spec.expectStatus)`. The retry/interval
 * gating loop lives in the core health-gate convention (`runHealthGate`); this
 * edge adapter owns only the fetch + timeout mapping (F-CLI-16). A thrown fetch
 * (timeout / connection refused) is a non-healthy outcome, never a raised error,
 * so the core gate can treat it as one failed attempt.
 */

import type {
  HealthProbeOutcome,
  HealthProbePort,
  HealthProbeSpec,
} from '../../domain/deploy/health-gate.ts';

/** Resolve the absolute probe URL from an explicit `url` or `host:port + path`. */
export function resolveProbeUrl(spec: HealthProbeSpec, host: string): string {
  if (spec.url) return spec.url;
  const path = spec.path ?? '/health';
  const portPart = spec.port ? `:${spec.port}` : '';
  return `http://${host}${portPart}${path}`;
}

/** Construction options for {@link FetchHealthProbe}. */
export interface FetchHealthProbeOptions {
  /** Host used when the spec carries `path`/`port` instead of a full `url`. */
  readonly host?: string;
  /** Fetch implementation seam (injected in tests). Defaults to global `fetch`. */
  readonly fetchFn?: typeof fetch;
}

/**
 * HTTP {@link HealthProbePort}. A single probe = one GET bounded by
 * `AbortSignal.timeout(spec.timeoutMs)`; the response body is cancelled to avoid
 * a leaked stream.
 */
export class FetchHealthProbe implements HealthProbePort {
  private readonly host: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: FetchHealthProbeOptions = {}) {
    this.host = options.host ?? '127.0.0.1';
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async probe(spec: HealthProbeSpec): Promise<HealthProbeOutcome> {
    const url = resolveProbeUrl(spec, this.host);
    try {
      const response = await this.fetchFn(url, { signal: AbortSignal.timeout(spec.timeoutMs) });
      await response.body?.cancel();
      return { healthy: response.status === spec.expectStatus, status: response.status };
    } catch {
      return { healthy: false };
    }
  }
}
