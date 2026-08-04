import { assertEquals } from '@std/assert';
import { describeOpenApiOperation, indexOpenApiOperations } from '../openapi-projection.ts';
import ladderFixture from './fixtures/openapi/description-ladder.json' with { type: 'json' };
import noDatabaseFixture from './fixtures/openapi/no-db-generated-openapi.json' with {
  type: 'json',
};

Deno.test('description ladder covers summary, description, id, and method-path rungs', () => {
  const descriptions = indexOpenApiOperations(ladderFixture).operations.map((operation) =>
    describeOpenApiOperation(operation)
  );
  assertEquals(descriptions, [
    'Published route summary',
    'Creates a fixture record.',
    'Update status (publisher)',
    'Invoke publish on publisher.',
  ]);
});

Deno.test('real generated no-summary spec uses the operation-id rung, not schema properties', () => {
  const index = indexOpenApiOperations(noDatabaseFixture);
  assertEquals(index.operations.map((operation) => operation.operation.summary), [
    undefined,
    undefined,
    undefined,
  ]);
  assertEquals(index.operations.map((operation) => describeOpenApiOperation(operation)), [
    'List (health)',
    'Update status (health)',
    'Check (health)',
  ]);
});
