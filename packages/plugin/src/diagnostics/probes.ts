/**
 * Generic HTTP-probe primitives shared by plugin E2E runners.
 *
 * NetScript plugins that ship runtime E2E probes (workers, sagas, streams) all
 * need the same handful of helpers: resolve a service base URL from environment
 * variables, normalize and join probe paths, summarize an HTTP response, and
 * assert success. None of these carry kind-specific knowledge, so this module
 * owns them once; each plugin's probe context becomes a thin set of calls that
 * supply only its env var names and default URL/paths.
 *
 * @module
 */

/**
 * HTTP response summary captured by an E2E probe.
 *
 * Produced by {@link summarizeResponse} and consumed by
 * {@link assertSuccessfulProbe}.
 */
export interface ProbeHttpResult {
  /** Requested URL. */
  readonly url: string;
  /** HTTP status code. */
  readonly status: number;
  /** HTTP status text. */
  readonly statusText: string;
  /** Response body preview for diagnostics. */
  readonly bodyPreview: string;
}

/** Options controlling {@link resolveProbeUrl} behavior. */
export interface ResolveProbeUrlOptions {
  /**
   * Strip a single trailing slash from the resolved URL. Defaults to `true`
   * (the sagas/streams behavior); pass `false` to preserve a URL verbatim.
   */
  readonly stripTrailingSlash?: boolean;
}

/**
 * Normalize a probe path so it always begins with a single leading slash.
 *
 * @param path - The path to normalize (with or without a leading slash).
 * @returns The path guaranteed to start with `/`.
 *
 * @example
 * ```ts
 * import { normalizeProbePath } from "@netscript/plugin";
 *
 * normalizeProbePath("health"); // "/health"
 * normalizeProbePath("/health"); // "/health"
 * ```
 */
export function normalizeProbePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Join a base URL and a probe path.
 *
 * Strips a trailing slash from the base URL and normalizes the path so the
 * result has exactly one slash between them.
 *
 * @param baseUrl - The service base URL.
 * @param path - The probe path, with or without a leading slash.
 * @returns The joined absolute URL.
 *
 * @example
 * ```ts
 * import { joinProbeUrl } from "@netscript/plugin";
 *
 * joinProbeUrl("http://localhost:8092/", "health"); // "http://localhost:8092/health"
 * ```
 */
export function joinProbeUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${normalizeProbePath(path)}`;
}

/**
 * Summarize an HTTP response for probe diagnostics.
 *
 * Reads the response body and captures a bounded 500-character preview
 * alongside the status fields.
 *
 * @param response - The HTTP response to summarize.
 * @returns A frozen {@link ProbeHttpResult} describing the response.
 *
 * @example
 * ```ts
 * import { summarizeResponse } from "@netscript/plugin";
 *
 * const result = await summarizeResponse(await fetch("http://localhost:8092/health"));
 * console.log(result.status);
 * ```
 */
export async function summarizeResponse(response: Response): Promise<ProbeHttpResult> {
  const body = await response.text();
  return Object.freeze({
    url: response.url,
    status: response.status,
    statusText: response.statusText,
    bodyPreview: body.slice(0, 500),
  });
}

/**
 * Throw when a probe response is not in the 2xx range.
 *
 * @param result - The probe result to assert on.
 * @param label - A human-readable probe label used in the error message.
 * @throws {Error} When `result.status` is outside the 200–299 range.
 *
 * @example
 * ```ts
 * import { assertSuccessfulProbe, summarizeResponse } from "@netscript/plugin";
 *
 * assertSuccessfulProbe(await summarizeResponse(response), "Sagas health");
 * ```
 */
export function assertSuccessfulProbe(result: ProbeHttpResult, label: string): void {
  if (result.status >= 200 && result.status < 300) {
    return;
  }
  throw new Error(
    `${label} probe failed with ${result.status} ${result.statusText}: ${result.bodyPreview}`,
  );
}

/**
 * Resolve a service base URL from a prioritized list of environment variables.
 *
 * Reads each name in `envVarNames` in order, returning the first defined value,
 * falling back to `fallbackUrl` when none are set. By default a single trailing
 * slash is stripped from the result; pass `{ stripTrailingSlash: false }` to
 * preserve the value verbatim.
 *
 * @param envVarNames - Environment variable names, tried in order.
 * @param fallbackUrl - URL used when no environment variable is set.
 * @param options - Optional behavior flags; see {@link ResolveProbeUrlOptions}.
 * @returns The resolved base URL.
 *
 * @example
 * ```ts
 * import { resolveProbeUrl } from "@netscript/plugin";
 *
 * // sagas: two env vars, trailing slash stripped (default)
 * resolveProbeUrl(["SAGAS_API_URL", "NETSCRIPT_SAGAS_URL"], "http://127.0.0.1:8092");
 *
 * // workers: single env var, preserve verbatim
 * resolveProbeUrl(["WORKERS_API_URL"], "http://localhost:8091", { stripTrailingSlash: false });
 * ```
 */
export function resolveProbeUrl(
  envVarNames: readonly string[],
  fallbackUrl: string,
  options?: ResolveProbeUrlOptions,
): string {
  let resolved = fallbackUrl;
  for (const name of envVarNames) {
    const value = Deno.env.get(name);
    if (value !== undefined) {
      resolved = value;
      break;
    }
  }
  const stripTrailingSlash = options?.stripTrailingSlash ?? true;
  return stripTrailingSlash ? resolved.replace(/\/$/, '') : resolved;
}
