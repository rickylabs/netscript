import { assertEquals, assertThrows } from '@std/assert';
import { buildServiceRpcPath } from '../mod.ts';

Deno.test('buildServiceRpcPath derives the shared default route', () => {
  assertEquals(buildServiceRpcPath({ routerName: 'workers' }), '/api/rpc/v1/workers');
  assertEquals(
    buildServiceRpcPath({
      routerName: '/workers/',
      apiPath: 'internal/rpc/',
      apiVersion: '/v2/',
    }),
    '/internal/rpc/v2/workers',
  );
});

Deno.test('buildServiceRpcPath rejects ambiguous segments', () => {
  assertThrows(() => buildServiceRpcPath({ routerName: '' }), TypeError);
  assertThrows(() => buildServiceRpcPath({ routerName: 'nested/workers' }), TypeError);
  assertThrows(
    () => buildServiceRpcPath({ routerName: 'workers', apiVersion: 'v1/beta' }),
    TypeError,
  );
});
