import { assertEquals } from '@std/assert';
import { os } from '@orpc/server';
import { Hono } from 'hono';
import { z } from 'zod';
import {
  createErrorHandler,
  createNotFoundHandler,
  createOpenAPIHandler,
  createOpenAPISpec,
  createService,
} from '../mod.ts';

interface OpenAPIParameter {
  readonly in?: string;
  readonly name?: string;
  readonly schema?: { readonly type?: string };
}

interface OpenAPIAccessOperation {
  readonly operationId?: string;
  readonly security?: readonly Readonly<Record<string, readonly string[]>>[];
  readonly summary?: string;
  readonly 'x-netscript-roles'?: readonly string[];
  readonly 'x-user-field'?: string;
}

interface OpenAPIAccessSpec {
  readonly components?: {
    readonly securitySchemes?: Readonly<Record<string, unknown>>;
  };
  readonly paths?: Readonly<
    Record<string, { readonly get?: OpenAPIAccessOperation }>
  >;
}

interface RpcContextBuilder {
  buildRpcContext(
    context: { get(key: string): unknown; req: { header(name: string): string | undefined } },
    traceContext: boolean,
  ): Record<string, unknown>;
}

Deno.test('createOpenAPIHandler coerces a docs-shaped numeric query parameter', async () => {
  const router = os.router({
    board: os
      .route({ method: 'GET', path: '/issues/board' })
      .input(z.object({ cycleId: z.number() }))
      .output(z.object({ cycleId: z.number() }))
      .handler(({ input }) => ({ cycleId: input.cycleId })),
  });
  const handler = createOpenAPIHandler(router);
  const docs = new Hono();
  docs.get(
    '/api/openapi.json',
    createOpenAPISpec(router, { title: 'Issue API', version: '1.0.0' }),
  );

  const specResponse = await docs.request('/api/openapi.json');
  const spec = await specResponse.json() as {
    readonly paths?: Record<
      string,
      { readonly get?: { readonly parameters?: OpenAPIParameter[] } }
    >;
  };
  const cycleId = spec.paths?.['/issues/board']?.get?.parameters?.find((parameter) =>
    parameter.name === 'cycleId'
  );

  const result = await handler.handle(
    new Request('http://localhost/api/issues/board?cycleId=1'),
    { prefix: '/api' },
  );

  assertEquals(specResponse.status, 200);
  assertEquals(cycleId?.in, 'query');
  assertEquals(cycleId?.schema?.type, 'number');
  assertEquals(result.matched, true);
  assertEquals(result.response?.status, 200);
  assertEquals(await result.response?.json(), { cycleId: 1 });
});

Deno.test('createOpenAPISpec projects distinct access declarations without rewriting operations', async () => {
  const router = os.router({
    publicStatus: os
      .route({ method: 'GET', path: '/status/public' })
      .output(z.object({ ok: z.boolean() }))
      .meta({ access: { authentication: 'none' } })
      .handler(() => ({ ok: true })),
    requiredStatus: os
      .route({
        method: 'GET',
        path: '/status/required',
        operationId: 'status.required.custom',
        spec: (operation) => ({
          ...operation,
          summary: 'Preserved required summary',
          'x-user-field': 'preserved',
        }),
      })
      .output(z.object({ ok: z.boolean() }))
      .meta({
        access: {
          authentication: 'required',
          authorization: { scopes: ['status:read'], roles: ['operator'] },
        },
      })
      .handler(() => ({ ok: true })),
    optionalStatus: os
      .route({ method: 'GET', path: '/status/optional' })
      .output(z.object({ ok: z.boolean() }))
      .meta({ access: { authentication: 'optional' } })
      .handler(() => ({ ok: true })),
    unspecifiedStatus: os
      .route({ method: 'GET', path: '/status/unspecified' })
      .output(z.object({ ok: z.boolean() }))
      .handler(() => ({ ok: true })),
  });
  const docs = new Hono();
  docs.get(
    '/api/openapi.json',
    createOpenAPISpec(router, { title: 'Access API', version: '1.0.0' }),
  );

  const response = await docs.request('/api/openapi.json');
  const spec = await response.json() as OpenAPIAccessSpec;
  const publicOperation = spec.paths?.['/status/public']?.get;
  const requiredOperation = spec.paths?.['/status/required']?.get;
  const optionalOperation = spec.paths?.['/status/optional']?.get;
  const unspecifiedOperation = spec.paths?.['/status/unspecified']?.get;

  assertEquals(response.status, 200);
  assertEquals(publicOperation?.security, []);
  assertEquals(requiredOperation?.security, [{ bearerAuth: ['status:read'] }]);
  assertEquals(requiredOperation?.['x-netscript-roles'], ['operator']);
  assertEquals(requiredOperation?.operationId, 'status.required.custom');
  assertEquals(requiredOperation?.summary, 'Preserved required summary');
  assertEquals(requiredOperation?.['x-user-field'], 'preserved');
  assertEquals(optionalOperation?.security, [{}, { bearerAuth: [] }]);
  assertEquals(Object.hasOwn(unspecifiedOperation ?? {}, 'security'), false);
  assertEquals(spec.components?.securitySchemes?.bearerAuth, {
    type: 'http',
    scheme: 'bearer',
  });
});

Deno.test('RPC context includes only configured trace headers with string values', () => {
  const builder = createService({}, { name: 'trace-context' }) as unknown as RpcContextBuilder;
  const requestContext = (headers: Readonly<Record<string, string>>) => ({
    get: (_key: string) => undefined,
    req: { header: (name: string) => headers[name] },
  });

  const parentOnly = builder.buildRpcContext(
    requestContext({ traceparent: '00-parent-span-01' }),
    true,
  );
  assertEquals(parentOnly.traceHeaders, { traceparent: '00-parent-span-01' });
  assertEquals(Object.hasOwn(parentOnly.traceHeaders as object, 'tracestate'), false);

  const stateOnly = builder.buildRpcContext(requestContext({ tracestate: 'vendor=value' }), true);
  assertEquals(stateOnly.traceHeaders, { tracestate: 'vendor=value' });
  assertEquals(Object.hasOwn(stateOnly.traceHeaders as object, 'traceparent'), false);

  const disabled = builder.buildRpcContext(
    requestContext({ traceparent: '00-parent-span-01', tracestate: 'vendor=value' }),
    false,
  );
  assertEquals(Object.hasOwn(disabled, 'traceHeaders'), false);

  const withoutHeaders = builder.buildRpcContext(requestContext({}), true);
  assertEquals(Object.hasOwn(withoutHeaders, 'traceHeaders'), false);
});

Deno.test('createNotFoundHandler returns service-scoped not found response', async () => {
  const app = new Hono();
  app.notFound(createNotFoundHandler('users'));
  const response = await app.request('/unknown');
  const body = await response.json();

  assertEquals(response.status, 404);
  assertEquals(body.error, 'NOT_FOUND');
  assertEquals(body.path, '/unknown');
});

Deno.test('createErrorHandler returns production-safe error response', async () => {
  const app = new Hono();
  app.onError(createErrorHandler('users'));
  app.get('/boom', () => {
    throw new Error('boom');
  });
  const response = await app.request('/boom');
  const body = await response.json();

  assertEquals(response.status, 500);
  assertEquals(body.error, 'INTERNAL_ERROR');
});
