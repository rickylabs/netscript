import { httpExchangeInit } from '../../domain/http-contract.ts';
import type { HttpClient, HttpRequest } from '../../ports/http-client.ts';

/** Fetch-backed HTTP adapter; the timeout signal also bounds any later body read. */
export class FetchHttpAdapter implements HttpClient {
  request(request: HttpRequest): Promise<Response> {
    return fetch(request.url, httpExchangeInit(request, AbortSignal.timeout(request.timeoutMs)));
  }
}
