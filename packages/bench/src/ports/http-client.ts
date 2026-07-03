/**
 * HttpClient port: a richer HTTP seam than the cli-e2e probe client.
 *
 * The cli-e2e `HttpClient` is GET/POST-only and returns only a body preview,
 * which cannot express the CRUD assertions the frozen suites need (request
 * bodies, headers, parsed JSON, full method set). This port is bench-local and
 * intentionally does not import from `@netscript/cli-e2e` — the package stays
 * self-contained for a clean lift to a standalone repo.
 *
 * @module
 */

/** HTTP method set required by the frozen CRUD suites. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** A full HTTP request. */
export interface HttpRequest {
  readonly method: HttpMethod;
  readonly url: string;
  readonly headers?: Readonly<Record<string, string>>;
  /** JSON-serializable body; serialized by the adapter when present. */
  readonly body?: unknown;
  readonly timeoutMs: number;
}

/** A full HTTP response with parsed and raw bodies. */
export interface HttpResponse {
  readonly status: number;
  readonly ok: boolean;
  readonly headers: Readonly<Record<string, string>>;
  /** Raw response text. */
  readonly text: string;
  /** Parsed JSON body when the response was JSON, else `undefined`. */
  readonly json: unknown;
}

/** Performs HTTP requests against the service under test. */
export interface HttpClient {
  request(request: HttpRequest): Promise<HttpResponse>;
}
