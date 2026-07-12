import { assertStringIncludes } from '@std/assert';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { addServiceHandler } from './add-service-handler.ts';

Deno.test('service add-handler verifies the contract then appends a router stub', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/app/contracts/versions/v1/orders.contract.ts', `
export const OrdersContractV1 = {
  createOrder: oc.route({ method: 'POST', path: '/orders' }).input(z.object({})).output(z.unknown()),
};
`);
  await fs.writeFile('/app/services/orders/src/routers/v1.ts', `
import { v1 } from '@app/contracts';
export const OrdersV1 = {};
`);
  const path = await addServiceHandler({
    service: 'orders',
    procedure: 'createOrder',
    version: 'v1',
    projectRoot: '/app',
  }, fs);
  assertStringIncludes(await fs.readFile(path), 'v1.orders.createOrder.handler');
});
