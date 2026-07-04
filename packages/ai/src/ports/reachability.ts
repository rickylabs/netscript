/**
 * Reachability port — a transport-agnostic host liveness seam.
 *
 * Some providers front a **local** or self-hosted endpoint (e.g. Ollama on
 * `http://localhost:11434`) that may simply be down. Rather than let the first
 * turn fail deep inside the provider SDK, a provider can probe the host through
 * a {@linkcode ReachabilityPort} and **degrade gracefully** on a typed,
 * non-throwing {@linkcode ReachabilityResult}.
 *
 * The core ships an optimistic no-op default ({@linkcode createAssumeReachablePort})
 * so nothing performs network I/O by default; a real probe (the fetch-backed
 * `HttpReachabilityAdapter`) is opt-in and lives in `src/adapters/`. The port is
 * deliberately store/transport-agnostic so any provider — not just Ollama — can
 * reuse it.
 *
 * @module
 */

/**
 * Outcome of a single reachability probe. Never thrown — a failed probe is a
 * value (`reachable: false`) so callers branch instead of catching.
 */
export interface ReachabilityResult {
  /** Whether the host answered the probe successfully. */
  readonly reachable: boolean;
  /** Human-readable detail (status text or error message) when not reachable. */
  readonly detail?: string;
}

/**
 * Per-probe options for {@linkcode ReachabilityPort.checkReachable}.
 */
export interface ReachabilityCheckOptions {
  /** Cancellation signal for the probe. */
  readonly signal?: AbortSignal;
}

/**
 * The host-reachability capability seam. Implementations map `host` to a
 * transport-specific liveness check and resolve a {@linkcode ReachabilityResult}
 * without throwing.
 */
export interface ReachabilityPort {
  /**
   * Probe whether `host` is currently reachable.
   *
   * @param host - Base host/origin to probe (e.g. `http://localhost:11434`).
   * @param options - Optional cancellation signal.
   * @returns A non-throwing {@linkcode ReachabilityResult}.
   */
  checkReachable(host: string, options?: ReachabilityCheckOptions): Promise<ReachabilityResult>;
}

/**
 * Create the default **optimistic** reachability port: every host is assumed
 * reachable and no network I/O is performed. This keeps the core probe-free;
 * wire a real adapter (e.g. the fetch-backed `HttpReachabilityAdapter`) when a
 * provider needs an actual liveness check.
 */
export function createAssumeReachablePort(): ReachabilityPort {
  return {
    checkReachable(): Promise<ReachabilityResult> {
      return Promise.resolve({ reachable: true });
    },
  };
}
