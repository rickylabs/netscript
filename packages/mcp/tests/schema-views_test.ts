import { assertEquals } from '@std/assert';
import { indexOpenApiOperations, projectOperationSchemaViews } from '../openapi-projection.ts';
import noDatabaseFixture from './fixtures/openapi/no-db-generated-openapi.json' with {
  type: 'json',
};
import schemaFixture from './fixtures/openapi/schema-views.json' with { type: 'json' };

Deno.test('schema views merge request parameters and expand bounded local refs', () => {
  const index = indexOpenApiOperations(schemaFixture);
  const views = projectOperationSchemaViews(index.document, index.operations[0]!);

  assertEquals(views.request.parameters, [
    { name: 'id', location: 'path', required: true, schema: { type: 'string' } },
    {
      name: 'trace',
      location: 'header',
      required: true,
      description: 'Operation override',
      schema: { type: 'string', minLength: 1 },
    },
  ]);
  assertEquals(views.request.body, {
    required: true,
    content: {
      'application/json': {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
    },
  });
  assertEquals(views.response['201']?.content['application/json'], {
    type: 'object',
    properties: { next: { $ref: '#/components/schemas/Node' } },
  });
});

Deno.test('error view compacts only detected identical declarations and preserves refs', () => {
  const index = indexOpenApiOperations(schemaFixture);
  const views = projectOperationSchemaViews(index.document, index.operations[0]!);

  assertEquals(views.errors.common, [{
    statuses: ['400', '422'],
    response: {
      description: 'Validation failed',
      content: {
        'application/json': {
          type: 'object',
          properties: { message: { type: 'string' } },
          required: ['message'],
        },
      },
    },
  }]);
  assertEquals(views.errors['500'], {
    description: 'External error',
    content: { 'application/json': { $ref: 'https://example.test/error.json' } },
  });
  assertEquals(views.errors.default, {
    description: 'Unresolved local error',
    content: { 'application/json': { $ref: '#/components/schemas/Missing' } },
  });
  assertEquals(views.all.errors, views.errors);
});

Deno.test('real no-database template has exactly empty error views without an envelope', () => {
  const index = indexOpenApiOperations(noDatabaseFixture);
  assertEquals(
    index.operations.map((operation) =>
      projectOperationSchemaViews(index.document, operation).errors
    ),
    [{}, {}, {}],
  );
});
