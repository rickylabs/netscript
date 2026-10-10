/** HTTP probe request. */
export interface HttpRequest {
  readonly method: 'GET' | 'POST';
  readonly url: string;
  readonly headers?: Readonly<Record<string, string>>;
  /** Cap on the whole exchange, including any body the caller goes on to read. */
  readonly timeoutMs: number;
}

/**
 * Port for local runtime HTTP probes. It resolves with the original Web `Response` as soon as
 * headers arrive — redirects are not followed — so the caller judges the status before, and
 * independently of, the body.
 */
export interface HttpClient {
  request(request: HttpRequest): Promise<Response>;
}
