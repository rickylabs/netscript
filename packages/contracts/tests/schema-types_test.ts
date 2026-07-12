import { assertEquals } from 'jsr:@std/assert@^1';
import { z } from 'zod';

import { createCrudContract } from '../crud.ts';
import {
  type ContractSchemaInput,
  type ContractSchemaOutput,
  OffsetPaginationQuerySchema,
} from '../mod.ts';
import { createPaginatedOutput } from '../query.ts';

Deno.test('schema types retain distinct coerced input and parsed output', () => {
  const input: ContractSchemaInput<typeof OffsetPaginationQuerySchema> = {
    limit: '25',
    offset: '5',
  };
  const output: ContractSchemaOutput<typeof OffsetPaginationQuerySchema> =
    OffsetPaginationQuerySchema.parse(input);

  assertEquals(output, { limit: 25, offset: 5 });
});

Deno.test('generic schema factories retain item input and output types', () => {
  const itemSchema = z.object({
    id: z.coerce.number(),
    name: z.string(),
  });
  const resultSchema = createPaginatedOutput(itemSchema);
  const input: ContractSchemaInput<typeof resultSchema> = {
    data: [{ id: '7', name: 'Ada' }],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  };
  const output: ContractSchemaOutput<typeof resultSchema> = resultSchema.parse(input);

  assertEquals(output.data, [{ id: 7, name: 'Ada' }]);
});

Deno.test('CRUD markers retain the configured identifier schema', () => {
  const entitySchema = z.object({ id: z.string(), name: z.string() });
  const createSchema = z.object({ name: z.string() });
  const updateSchema = createSchema.partial();
  const idSchema = z.string().uuid();
  const contract = createCrudContract({
    resource: 'users',
    entitySchema,
    createSchema,
    updateSchema,
    idSchema,
  });

  type IdInputSchema = typeof contract.getById['~orpc']['inputSchema'];
  const input: ContractSchemaInput<IdInputSchema> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
  };
  const output: ContractSchemaOutput<IdInputSchema> = input;

  assertEquals(output.id, input.id);
});
