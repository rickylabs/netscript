import { assertEquals, assertStringIncludes } from '@std/assert';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { inspectContract } from '../inspect/inspect-contract.ts';
import { addContractRoute } from './add-contract-route.ts';

Deno.test('contract add-route emits an inspectable typed procedure', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/app/contracts/versions/v1/orders.contract.ts', `
import { z } from 'zod';
import { oc } from '@orpc/contract';
export const OrdersContractV1 = {};
export const OrdersV1 = implement(OrdersContractV1);
`);
  const path = await addContractRoute({
    contract: 'orders',
    procedure: 'createOrder',
    method: 'post',
    path: '/orders',
    input: 'z.object({ name: z.string() })',
    output: 'z.object({ id: z.number() })',
    version: 'v1',
    projectRoot: '/app',
  }, fs);
  assertStringIncludes(await fs.readFile(path), ".route({ method: 'POST', path: '/orders' })");
  const inspection = await inspectContract('orders', 'v1', '/app', fs);
  assertEquals(inspection.procedures[0].name, 'createOrder');
  assertEquals(inspection.procedures[0].output, 'z.object({ id: z.number() })');
});
