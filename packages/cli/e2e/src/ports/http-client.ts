/** HTTP probe request. */
export interface HttpRequest {
  readonly method: 'GET' | 'POST';
  readonly url: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly timeoutMs: number;
}

/** HTTP probe response. */
export interface HttpResult {
  readonly status: number;
  readonly ok: boolean;
  readonly bodyPreview: string;
  /** Body text, read up to the contract body limit. */
  readonly body: string;
  /** Whether `body` stopped at the contract body limit. */
  readonly bodyTruncated: boolean;
}

/** Port for local runtime HTTP probes. */
export interface HttpClient {
  request(request: HttpRequest): Promise<HttpResult>;
}
