import { assertEquals, assertThrows } from '@std/assert';
import { indexOpenApiOperations } from '../openapi-projection.ts';

Deno.test('operation index preserves deterministic path and method source order', () => {
  const index = indexOpenApiOperations({
    openapi: '3.1.1',
    paths: {
      '/health': {
        parameters: [],
        post: { operationId: 'v1.health.updateStatus' },
        get: { operationId: 'v1.health.list' },
      },
      '/jobs/{id}': {
        summary: 'path metadata, not an operation',
        delete: {},
      },
    },
  });

  assertEquals(
    index.operations.map(({ canonicalId, method, path, methodPath, operationId }) => ({
      canonicalId,
      method,
      path,
      methodPath,
      operationId,
    })),
    [
      {
        canonicalId: 'v1.health.updateStatus',
        method: 'POST',
        path: '/health',
        methodPath: 'POST /health',
        operationId: 'v1.health.updateStatus',
      },
      {
        canonicalId: 'v1.health.list',
        method: 'GET',
        path: '/health',
        methodPath: 'GET /health',
        operationId: 'v1.health.list',
      },
      {
        canonicalId: 'DELETE /jobs/{id}',
        method: 'DELETE',
        path: '/jobs/{id}',
        methodPath: 'DELETE /jobs/{id}',
        operationId: undefined,
      },
    ],
  );
});

Deno.test('operation index ignores non-object paths and unsupported path keys', () => {
  assertEquals(indexOpenApiOperations({ paths: { '/health': null } }).operations, []);
  assertEquals(indexOpenApiOperations({}).operations, []);
  assertThrows(() => indexOpenApiOperations([]), TypeError, 'must be an object');
});
