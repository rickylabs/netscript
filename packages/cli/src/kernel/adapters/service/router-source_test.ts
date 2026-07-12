import { assertStringIncludes } from '@std/assert';
import { appendServiceHandler } from './router-source.ts';

Deno.test('service handler append binds through the generated typed contract router', () => {
  const source = `
import { v1 } from '@app/contracts';
export const OrdersV1 = {
  list: v1.orders.list.handler(async () => []),
};
`;
  const updated = appendServiceHandler(source, 'orders', 'createOrder', 'v1');
  assertStringIncludes(updated, 'createOrder: v1.orders.createOrder.handler');
  assertStringIncludes(updated, "throw new Error('Not implemented: createOrder')");
});
