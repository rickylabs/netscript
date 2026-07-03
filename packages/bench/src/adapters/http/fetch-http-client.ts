/**
 * Fetch-based HTTP client: the live {@link HttpClient} used by the conformance
 * path (Slice 1b). Serializes JSON bodies, parses JSON responses, and enforces
 * a per-request timeout via `AbortSignal.timeout`.
 *
 * @module
 */

import type { HttpClient, HttpRequest, HttpResponse } from '../../ports/http-client.ts';

/** {@link HttpClient} backed by the platform `fetch`. */
export class FetchHttpClient implements HttpClient {
  async request(request: HttpRequest): Promise<HttpResponse> {
    const init: RequestInit = {
      method: request.method,
      headers: {
        ...(request.body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(request.headers ?? {}),
      },
      signal: AbortSignal.timeout(request.timeoutMs),
    };
    if (request.body !== undefined) {
      init.body = JSON.stringify(request.body);
    }

    const response = await fetch(request.url, init);
    const text = await response.text();
    const headers: Record<string, string> = {};
    for (const [key, value] of response.headers.entries()) {
      headers[key] = value;
    }

    let json: unknown;
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json') && text.length > 0) {
      try {
        json = JSON.parse(text);
      } catch {
        json = undefined;
      }
    }

    return {
      status: response.status,
      ok: response.ok,
      headers,
      text,
      json,
    };
  }
}
