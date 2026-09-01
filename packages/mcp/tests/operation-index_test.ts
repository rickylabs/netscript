import { assertEquals, assertThrows } from '@std/assert';
import { indexOpenApiOperations } from '../openapi-projection.ts';
import { deriveOperationAccessSummary } from '../src/domain/openapi/operation-access.ts';

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

Deno.test('operation index retains the four raw access states for bounded reverse projection', () => {
  const index = indexOpenApiOperations({
    paths: {
      '/undeclared': { get: { operationId: 'access.undeclared' } },
      '/public': {
        get: {
          operationId: 'access.public',
          security: [],
          'x-netscript-roles': ['anonymous'],
        },
      },
      '/optional': {
        get: {
          operationId: 'access.optional',
          security: [{}, { bearerAuth: [] }],
        },
      },
      '/required': {
        get: {
          operationId: 'access.required',
          security: [{ bearerAuth: ['catalog:read'] }],
          'x-netscript-roles': ['reader'],
        },
      },
    },
  });

  assertEquals(Object.hasOwn(index.operations[0]!.operation, 'security'), false);
  assertEquals(
    index.operations.map((operation) => deriveOperationAccessSummary(operation.operation)),
    [
      undefined,
      {
        authentication: 'none',
        securitySchemes: [],
        scopes: [],
        roles: ['anonymous'],
      },
      {
        authentication: 'optional',
        securitySchemes: ['bearerAuth'],
        scopes: [],
        roles: [],
      },
      {
        authentication: 'required',
        securitySchemes: ['bearerAuth'],
        scopes: ['catalog:read'],
        roles: ['reader'],
      },
    ],
  );
});
