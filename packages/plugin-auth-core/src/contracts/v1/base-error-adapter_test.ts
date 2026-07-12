import { assertEquals, assertThrows } from '@std/assert';
import { z } from 'zod';
import { toContractErrorDefinition } from './base-error-adapter.ts';

Deno.test('base error adapter validates the Standard Schema boundary', () => {
  const definition = toContractErrorDefinition({
    data: z.object({ id: z.string() }),
    message: 'Missing',
    status: 404,
  });

  assertEquals(definition.status, 404);
  assertEquals(definition.data?.['~standard'].version, 1);
  assertThrows(
    () => toContractErrorDefinition({ data: {}, message: 'Invalid', status: 500 }),
    TypeError,
    'Base plugin error data must implement Standard Schema V1',
  );
});
