/**
 * Fetch-backed {@linkcode ReachabilityPort} implementation.
 *
 * Probes a host by issuing a lightweight `GET {host}{path}` with Web `fetch` and
 * reporting the outcome as a non-throwing {@linkcode ReachabilityResult}. It is
 * transport-agnostic beyond "speaks HTTP": the Ollama provider points it at
 * `/api/tags`, but any provider fronting an HTTP endpoint can reuse it with a
 * different `path` (e.g. `/v1/models`).
 *
 * @module
 */

import type {
  ReachabilityCheckOptions,
  ReachabilityPort,
  ReachabilityResult,
} from '../ports/reachability.ts';

/**
 * Default liveness path probed by {@linkcode HttpReachabilityAdapter} — the
 * native Ollama model-listing endpoint.
 */
export const DEFAULT_REACHABILITY_PATH = '/api/tags' as const;

/**
 * Configuration for {@linkcode HttpReachabilityAdapter}.
 */
export interface HttpReachabilityConfig {
  /** Path appended to the host for the probe (defaults to `/api/tags`). */
  readonly path?: string;
  /** Fetch implementation, primarily for unit tests. */
  readonly fetch?: typeof fetch;
}

/**
 * An HTTP {@linkcode ReachabilityPort}: `GET {host}{path}` and treat any
 * non-network response as "reachable" (the host answered), a non-2xx status as
 * an unreachable-with-detail result, and a thrown fetch (DNS/connection refused)
 * as unreachable carrying the error message.
 *
 * @example
 * ```ts
 * const port = new HttpReachabilityAdapter();
 * const result = await port.checkReachable('http://localhost:11434');
 * if (!result.reachable) console.warn(result.detail);
 * ```
 */
export class HttpReachabilityAdapter implements ReachabilityPort {
  readonly #config: HttpReachabilityConfig;

  /** Construct an adapter bound to the given `config` (defaults to `{}`). */
  constructor(config: HttpReachabilityConfig = {}) {
    this.#config = config;
  }

  /**
   * Probe `host` by issuing `GET {host}{path}`.
   *
   * @param host - Base host/origin to probe (trailing slashes are trimmed).
   * @param options - Optional cancellation signal.
   * @returns A non-throwing {@linkcode ReachabilityResult}.
   */
  async checkReachable(
    host: string,
    options: ReachabilityCheckOptions = {},
  ): Promise<ReachabilityResult> {
    const request = this.#config.fetch ?? fetch;
    const path = this.#config.path ?? DEFAULT_REACHABILITY_PATH;
    const url = `${host.replace(/\/+$/, '')}${path}`;
    try {
      const response = await request(url, { method: 'GET', signal: options.signal });
      if (response.body) {
        await response.body.cancel();
      }
      if (response.ok) {
        return { reachable: true };
      }
      return { reachable: false, detail: `HTTP ${response.status} from ${url}` };
    } catch (cause) {
      return { reachable: false, detail: reachabilityError(cause, url) };
    }
  }
}

/**
 * Construct the default fetch-backed {@linkcode ReachabilityPort}.
 *
 * @param config - Optional path/fetch overrides.
 */
export function createHttpReachabilityPort(config: HttpReachabilityConfig = {}): ReachabilityPort {
  return new HttpReachabilityAdapter(config);
}

/** Reduce a thrown fetch failure to a probe detail string. */
function reachabilityError(cause: unknown, url: string): string {
  const message = cause instanceof Error ? cause.message : String(cause);
  return `${url} unreachable: ${message}`;
}
