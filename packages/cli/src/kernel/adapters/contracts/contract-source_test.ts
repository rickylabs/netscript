import {
  assertEquals,
  assertStringIncludes,
} from '@std/assert';
import {
  appendContractRoute,
  inspectContractSource,
  promoteContractSource,
} from './contract-source.ts';

const SOURCE = `
import { z } from 'zod';
import { oc } from '@orpc/contract';
export const OrdersContractV1 = {
  list: oc
    .route({ method: 'GET', path: '/orders' })
    .input(z.object({ limit: z.number() }))
    .output(z.array(z.string())),
};
export const OrdersV1 = implement(OrdersContractV1);
`;

Deno.test('contract source promotion renames versioned symbols and prose', () => {
  const promoted = promoteContractSource(`${SOURCE}\n// Version 1`, 'v1', 'v2');
  assertStringIncludes(promoted, 'OrdersContractV2');
  assertStringIncludes(promoted, 'OrdersV2');
  assertStringIncludes(promoted, 'Version 2');
});

Deno.test('contract route append round-trips through structured inspection', () => {
  const updated = appendContractRoute(
    SOURCE,
    'orders',
    'v1',
    'createOrder',
    'POST',
    '/orders',
    'z.object({ name: z.string() })',
    'z.object({ id: z.number() })',
  );
  const procedures = inspectContractSource(updated);
  assertEquals(procedures, [
    {
      name: 'list',
      method: 'GET',
      path: '/orders',
      input: 'z.object({ limit: z.number() })',
      output: 'z.array(z.string())',
    },
    {
      name: 'createOrder',
      method: 'POST',
      path: '/orders',
      input: 'z.object({ name: z.string() })',
      output: 'z.object({ id: z.number() })',
    },
  ]);
});
