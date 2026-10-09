import { readBoundedBody } from '../../domain/http-contract.ts';
import type { HttpClient, HttpRequest, HttpResult } from '../../ports/http-client.ts';

/** Fetch-backed HTTP adapter with timeout support. */
export class FetchHttpAdapter implements HttpClient {
  async request(request: HttpRequest): Promise<HttpResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs);
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        signal: controller.signal,
      });
      const { body, bodyTruncated } = await readBoundedBody(response);
      return {
        status: response.status,
        ok: response.ok,
        bodyPreview: body.slice(0, 1_000),
        body,
        bodyTruncated,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
