import type { HttpClient, HttpRequest, HttpResult } from '../../ports/http-client.ts';

/** Fetch-backed HTTP adapter with timeout support. */
export class FetchHttpAdapter implements HttpClient {
  async request(request: HttpRequest): Promise<HttpResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs);
    try {
      const response = await fetch(request.url, {
        method: request.method,
        signal: controller.signal,
      });
      return {
        status: response.status,
        ok: response.ok,
        bodyPreview: (await response.text()).slice(0, 1_000),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
