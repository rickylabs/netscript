import { assert, assertEquals } from '@std/assert';
import { workersContractV1 } from '@netscript/plugin-workers/contracts';
import { createOpenAPIHandler, createOpenAPISpec, createRPCHandler } from '@netscript/service';
import { Hono } from 'hono';

function fixture() {
  const targets: Array<string | undefined> = [];
  const router = {
    triggerJob: workersContractV1.triggerJob.handler(({ input }) => {
      targets.push(input.id);
      return { jobId: input.id ?? '', triggered: true };
    }),
    triggerTask: workersContractV1.triggerTask.handler(({ input }) => {
      targets.push(input.id);
      return { taskId: input.id ?? '', triggered: true };
    }),
  };
  const docs = new Hono();
  docs.get(
    '/api/openapi.json',
    createOpenAPISpec(router, {
      title: 'Workers trigger contract regression',
      version: '1.0.0',
    }),
  );
  return {
    docs,
    targets,
    rest: createOpenAPIHandler(router),
    rpc: createRPCHandler(router),
  };
}

interface TriggerSpec {
  readonly paths: Record<string, {
    readonly post: {
      readonly parameters: ReadonlyArray<{
        readonly name: string;
        readonly in: string;
        readonly required: boolean;
        readonly schema: { readonly type: string };
      }>;
      readonly requestBody: {
        readonly required: boolean;
        readonly content: {
          readonly 'application/json': {
            readonly schema: {
              readonly properties: Readonly<Record<string, unknown>>;
              readonly required?: readonly string[];
            };
          };
        };
      };
    };
  }>;
}

Deno.test('worker trigger OpenAPI requires the path id and leaves it out of the body', async () => {
  const { docs, targets } = fixture();
  const response = await docs.request('/api/openapi.json');
  assertEquals(response.status, 200, await response.clone().text());
  const spec: TriggerSpec = await response.json();
  for (const resource of ['jobs', 'tasks']) {
    const operation = spec.paths[`/${resource}/{id}/trigger`].post;
    const id = operation.parameters.find((parameter) => parameter.name === 'id');
    assert(id);
    assertEquals([id.in, id.required, id.schema.type], ['path', true, 'string']);
    assertEquals(operation.requestBody.required, false);
    const body = operation.requestBody.content['application/json'].schema;
    assertEquals('id' in body.properties, false);
    assertEquals(body.required?.includes('id') ?? false, false);
  }
  assertEquals(targets, []);
});

Deno.test('worker trigger REST keeps path-only, bodyless and conflicting-body-id behavior', async () => {
  const { rest, targets } = fixture();
  for (const resource of ['jobs', 'tasks']) {
    for (const body of [undefined, {}, { id: 'wrong-body-id', payload: { ok: true } }]) {
      const result = await rest.handle(
        new Request(`http://localhost/api/${resource}/path-target/trigger`, {
          method: 'POST',
          ...(body === undefined ? {} : {
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
          }),
        }),
        { prefix: '/api', context: {} },
      );
      assert(result.matched);
      assertEquals(result.response?.status, 200);
      await result.response?.body?.cancel();
    }
  }
  assertEquals(targets, Array.from({ length: 6 }, () => 'path-target'));
});

Deno.test('worker trigger rejects malformed REST input and targetless RPC before handlers', async () => {
  const { rest, rpc, targets } = fixture();
  for (const [resource, procedure] of [['jobs', 'triggerJob'], ['tasks', 'triggerTask']]) {
    const malformed = await rest.handle(
      new Request(`http://localhost/api/${resource}/path-target/trigger`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ delay: -1 }),
      }),
      { prefix: '/api', context: {} },
    );
    assert(malformed.matched);
    assertEquals(malformed.response?.status, 400);
    await malformed.response?.body?.cancel();
    const targetless = await rpc.handle(
      new Request(`http://localhost/rpc/${procedure}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: {} }),
      }),
      { prefix: '/rpc', context: {} },
    );
    assert(targetless.matched);
    assertEquals(targetless.response?.status, 400);
    await targetless.response?.body?.cancel();
  }
  assertEquals(targets, []);
});
