/** Minimal JSON request accepted by the workers runtime API client. */
export type WorkersRuntimeRequest = Readonly<{
  method?: 'GET' | 'POST';
  query?: Readonly<Record<string, string | number | boolean | undefined>>;
  body?: unknown;
}>;

/** Runtime API seam consumed by durable workers CLI commands. */
export interface WorkersRuntimeApiClient {
  /** Request a workers API route and return its decoded JSON body. */
  request(path: string, request?: WorkersRuntimeRequest): Promise<unknown>;
}

/** Options for the fetch-backed workers runtime API adapter. */
export type FetchWorkersRuntimeApiClientOptions = Readonly<{
  baseUrl?: string;
  fetcher?: typeof fetch;
}>;

/** Fetch-backed adapter for the workers OpenAPI projection. */
export class FetchWorkersRuntimeApiClient implements WorkersRuntimeApiClient {
  readonly #baseUrl: string;
  readonly #fetcher: typeof fetch;

  /** Create a client targeting the conventional local workers API by default. */
  constructor(options: FetchWorkersRuntimeApiClientOptions = {}) {
    this.#baseUrl = (options.baseUrl ?? 'http://127.0.0.1:8091/api/v1/workers').replace(/\/$/, '');
    this.#fetcher = options.fetcher ?? fetch;
  }

  /** Request a workers route and decode a successful JSON response. */
  async request(path: string, request: WorkersRuntimeRequest = {}): Promise<unknown> {
    const url = new URL(`${this.#baseUrl}/${path.replace(/^\//, '')}`);
    for (const [name, value] of Object.entries(request.query ?? {})) {
      if (value !== undefined) url.searchParams.set(name, String(value));
    }
    const response = await this.#fetcher(url, {
      method: request.method ?? 'GET',
      headers: request.body === undefined ? undefined : { 'content-type': 'application/json' },
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Workers API ${response.status} ${response.statusText}: ${text}`.trim());
    }
    return text.length ? JSON.parse(text) : undefined;
  }
}
