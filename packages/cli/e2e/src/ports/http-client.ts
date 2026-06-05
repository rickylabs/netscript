/** HTTP probe request. */
export interface HttpRequest {
  readonly method: 'GET' | 'POST';
  readonly url: string;
  readonly timeoutMs: number;
}

/** HTTP probe response. */
export interface HttpResult {
  readonly status: number;
  readonly ok: boolean;
  readonly bodyPreview: string;
}

/** Port for local runtime HTTP probes. */
export interface HttpClient {
  request(request: HttpRequest): Promise<HttpResult>;
}
