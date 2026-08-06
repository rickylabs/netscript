/** Credential-isolated split gateway for Claude Remote Control model traffic. */

import {
  ANTHROPIC_API_BASE_URL,
  LOOPBACK_HOST,
  LOOPBACK_HTTP_PROTOCOL,
  OPENROUTER_ANTHROPIC_BASE_URL,
} from '../config/endpoints.ts';

const MODEL_PATH = '/v1/messages';
const MAX_MODEL_REQUEST_BYTES = 16 * 1024 * 1024;
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

export interface RemoteModelGatewayOptions {
  readonly model: string;
  readonly openRouterApiKey: string;
}

export interface RemoteModelGatewayPorts {
  readonly fetch: (request: Request) => Promise<Response>;
}

export interface RemoteModelGateway {
  readonly baseUrl: string;
  readonly close: () => Promise<void>;
}

function targetUrl(requestUrl: string, baseUrl: string): string {
  const incoming = new URL(requestUrl);
  const configured = new URL(baseUrl);
  configured.pathname = `${configured.pathname.replace(/\/$/, '')}${incoming.pathname}`;
  configured.search = incoming.search;
  configured.hash = '';
  return configured.href;
}

function forwardedHeaders(
  source: Headers,
  destination: 'anthropic' | 'openrouter',
  openRouterApiKey: string,
): Headers {
  const headers = new Headers(source);
  const connectionTokens = (headers.get('connection') ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  for (const name of [...HOP_BY_HOP_HEADERS, ...connectionTokens, 'host', 'content-length']) {
    headers.delete(name);
  }
  if (destination === 'openrouter') {
    headers.delete('authorization');
    headers.delete('x-api-key');
    headers.delete('proxy-authorization');
    headers.set('authorization', `Bearer ${openRouterApiKey}`);
  } else {
    if (headers.get('authorization') === `Bearer ${openRouterApiKey}`) {
      headers.delete('authorization');
    }
    if (headers.get('x-api-key') === openRouterApiKey) headers.delete('x-api-key');
  }
  return headers;
}

function malformedModelResponse(): Response {
  return Response.json({
    error: {
      type: 'invalid_model_request',
      message: 'model requests must contain a JSON object',
    },
  }, { status: 400 });
}

function oversizedModelResponse(): Response {
  return Response.json({
    error: {
      type: 'model_request_too_large',
      message: 'model request exceeds the gateway limit',
    },
  }, { status: 413 });
}

async function openRouterRequest(
  request: Request,
  options: RemoteModelGatewayOptions,
): Promise<Request | null> {
  if (request.method === 'GET' || request.method === 'HEAD') return null;
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_MODEL_REQUEST_BYTES) return null;
  let body: unknown;
  try {
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > MAX_MODEL_REQUEST_BYTES) return null;
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const rewritten = { ...(body as Record<string, unknown>), model: options.model };
  const headers = forwardedHeaders(request.headers, 'openrouter', options.openRouterApiKey);
  headers.set('content-type', 'application/json');
  return new Request(targetUrl(request.url, OPENROUTER_ANTHROPIC_BASE_URL), {
    method: request.method,
    headers,
    body: JSON.stringify(rewritten),
    redirect: 'manual',
  });
}

/** Builds the pure request classifier and credential boundary used by the server. */
export function createRemoteModelGatewayHandler(
  options: RemoteModelGatewayOptions,
  ports: RemoteModelGatewayPorts,
): (request: Request) => Promise<Response> {
  if (!options.model.trim()) throw new Error('gateway model is required');
  if (!options.openRouterApiKey.trim()) throw new Error('OpenRouter credential is required');
  return async (request) => {
    const incoming = new URL(request.url);
    let upstream: Request;
    if (incoming.pathname === MODEL_PATH) {
      const declaredLength = Number(request.headers.get('content-length'));
      if (Number.isFinite(declaredLength) && declaredLength > MAX_MODEL_REQUEST_BYTES) {
        return oversizedModelResponse();
      }
      const modelRequest = await openRouterRequest(request, options);
      if (!modelRequest) return malformedModelResponse();
      upstream = modelRequest;
    } else {
      upstream = new Request(targetUrl(request.url, ANTHROPIC_API_BASE_URL), {
        method: request.method,
        headers: forwardedHeaders(request.headers, 'anthropic', options.openRouterApiKey),
        body: request.body,
        redirect: 'manual',
        duplex: request.body ? 'half' : undefined,
      } as RequestInit);
    }
    return await ports.fetch(upstream);
  };
}

/** Starts the gateway on an ephemeral loopback port. */
export function startRemoteModelGateway(options: RemoteModelGatewayOptions): RemoteModelGateway {
  const controller = new AbortController();
  const server = Deno.serve({
    hostname: LOOPBACK_HOST,
    port: 0,
    signal: controller.signal,
    onListen() {},
  }, createRemoteModelGatewayHandler(options, { fetch }));
  const address = server.addr as Deno.NetAddr;
  let closed = false;
  return {
    baseUrl: `${LOOPBACK_HTTP_PROTOCOL}//${address.hostname}:${address.port}`,
    close: async () => {
      if (!closed) {
        closed = true;
        controller.abort();
      }
      await server.finished.catch(() => undefined);
    },
  };
}
