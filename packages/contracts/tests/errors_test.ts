import { getResourceType } from '../src/domain/errors.ts';

function assertEquals(actual: string, expected: string): void {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, received ${actual}`);
  }
}

Deno.test('getResourceType falls back to resource for empty paths', () => {
  assertEquals(getResourceType({}), 'resource');
  assertEquals(getResourceType({ path: [] }), 'resource');
  assertEquals(getResourceType({ path: ['v1'] }), 'resource');
});

Deno.test('getResourceType skips version segments and singularizes resources', () => {
  assertEquals(getResourceType({ path: ['v1', 'users'] }), 'user');
  assertEquals(getResourceType({ path: ['v2', 'sagas', 'getById'] }), 'saga');
  assertEquals(getResourceType({ path: ['jobs'] }), 'job');
});
