/** Minimal JSON request accepted by the sagas runtime API client. */
export type SagasRuntimeRequest = Readonly<{
  method?: 'GET' | 'POST';
  query?: Readonly<Record<string, string | number | boolean | undefined>>;
  body?: unknown;
}>;

/** Runtime API seam consumed by durable sagas CLI commands. */
export interface SagasRuntimeApiClient {
  /** Request a sagas API route and return its decoded JSON body. */
  request(path: string, request?: SagasRuntimeRequest): Promise<unknown>;
}

/** Options for the fetch-backed sagas runtime API adapter. */
export type FetchSagasRuntimeApiClientOptions = Readonly<{
  baseUrl?: string;
  fetcher?: typeof fetch;
}>;

/** Fetch-backed adapter for the sagas OpenAPI projection. */
export class FetchSagasRuntimeApiClient implements SagasRuntimeApiClient {
  readonly #baseUrl: string;
  readonly #fetcher: typeof fetch;

  /** Create a client targeting the conventional local sagas API by default. */
  constructor(options: FetchSagasRuntimeApiClientOptions = {}) {
    this.#baseUrl = (options.baseUrl ?? 'http://127.0.0.1:8092/api/v1/sagas').replace(/\/$/, '');
    this.#fetcher = options.fetcher ?? fetch;
  }

  /** Request a sagas route and decode a successful JSON response. */
  async request(path: string, request: SagasRuntimeRequest = {}): Promise<unknown> {
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
      throw new Error(`Sagas API ${response.status} ${response.statusText}: ${text}`.trim());
    }
    return text.length ? JSON.parse(text) : undefined;
  }
}
