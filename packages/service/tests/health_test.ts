import { assertEquals } from '@std/assert';
import { createHealthHandler, createLivenessHandler, createReadinessHandler } from '../mod.ts';
import type { ServiceContext } from '../mod.ts';

function createContext(): ServiceContext {
  return {
    req: {
      raw: new Request('http://localhost/health'),
      path: '/health',
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

Deno.test('createHealthHandler returns healthy with no checks', async () => {
  const response = await createHealthHandler()(createContext());
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body.status, 'healthy');
});

Deno.test('createLivenessHandler returns ok', async () => {
  const response = await createLivenessHandler()(createContext());
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body.status, 'ok');
});

Deno.test('createReadinessHandler reports failed readiness', async () => {
  const response = await createReadinessHandler([() => Promise.resolve(false)])(createContext());
  const body = await response.json();

  assertEquals(response.status, 503);
  assertEquals(body.ready, false);
});
