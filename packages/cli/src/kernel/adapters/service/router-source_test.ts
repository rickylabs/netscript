import { assertStringIncludes, assertThrows } from '@std/assert';
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

Deno.test('service handler append targets the factory return and preserves its closing braces', () => {
  const source = `
export function createOrdersV2(application: OrdersApplication) {
  return {
    list: v2.orders.list.handler(({ input }) => application.list(input)),
  };
}
export const unrelated = {};
`;
  const updated = appendServiceHandler(source, 'orders', 'recent', 'v2');
  assertStringIncludes(updated, '    recent: v2.orders.recent.handler');
  assertStringIncludes(updated, '    }),\n  };\n}\nexport const unrelated = {};');
  assertThrows(
    () => appendServiceHandler(updated, 'orders', 'recent', 'v2'),
    Error,
    'already exists',
  );
});

Deno.test('service handler append rejects a factory without a returned router object', () => {
  assertThrows(
    () =>
      appendServiceHandler(
        'export function createOrdersV1(application) { return application; }',
        'orders',
        'recent',
        'v1',
      ),
    Error,
    'returned object was not found',
  );
});
