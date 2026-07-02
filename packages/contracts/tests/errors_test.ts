import { getResourceType, validationFailed } from '../src/domain/errors.ts';

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

Deno.test('validationFailed throws a VALIDATION_ERROR envelope via the errors object', () => {
  const calls: Array<{ message: string; data: unknown }> = [];
  const errors = {
    VALIDATION_ERROR(options: { message: string; data: unknown }): Error {
      calls.push(options);
      return new Error(options.message);
    },
  };

  let thrown: unknown;
  try {
    validationFailed({
      errors,
      message: 'Job id is required in the {id} path segment.',
      fieldErrors: { id: ['Job id is required in the {id} path segment.'] },
    });
  } catch (error) {
    thrown = error;
  }

  if (!(thrown instanceof Error)) {
    throw new Error('validationFailed must throw the constructed oRPC error');
  }
  assertEquals(thrown.message, 'Job id is required in the {id} path segment.');
  if (calls.length !== 1) {
    throw new Error(`Expected 1 VALIDATION_ERROR call, received ${calls.length}`);
  }
  assertEquals(calls[0].message, 'Job id is required in the {id} path segment.');
  assertEquals(
    JSON.stringify(calls[0].data),
    JSON.stringify({
      formErrors: [],
      fieldErrors: { id: ['Job id is required in the {id} path segment.'] },
    }),
  );
});
