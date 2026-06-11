import { assertEquals } from '@std/assert';
import { createErrorHandler, createNotFoundHandler } from '../mod.ts';
import type { ServiceContext } from '../mod.ts';

function createContext(path = '/missing'): ServiceContext {
  return {
    req: {
      raw: new Request(`http://localhost${path}`),
      path,
      header: () => undefined,
    },
    json: (data: unknown, status = 200) =>
      Response.json(data, { status }),
    html: (html: string, status = 200) =>
      new Response(html, {
        status,
        headers: { 'content-type': 'text/html' },
      }),
    body: (data: BodyInit | null, status = 200, headers?: HeadersInit) =>
      new Response(data, { status, headers }),
    newResponse: (data?: BodyInit | null, init?: Response | ResponseInit) =>
      new Response(data, init),
    get: () => undefined,
  };
}

Deno.test('createNotFoundHandler returns service-scoped not found response', async () => {
  const response = await createNotFoundHandler('users')(createContext('/unknown'));
  const body = await response.json();

  assertEquals(response.status, 404);
  assertEquals(body.error, 'NOT_FOUND');
  assertEquals(body.path, '/unknown');
});

Deno.test('createErrorHandler returns production-safe error response', async () => {
  const response = await createErrorHandler('users')(new Error('boom'), createContext());
  const body = await response.json();

  assertEquals(response.status, 500);
  assertEquals(body.error, 'INTERNAL_ERROR');
});
