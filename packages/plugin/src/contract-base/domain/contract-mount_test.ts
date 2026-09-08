import { assertEquals, assertNotStrictEquals, assertThrows } from '@std/assert';
import { baseContract, SuccessSchema } from '@netscript/contracts';
import { mountPluginContract } from './contract-mount.ts';

Deno.test('contract mount preserves metadata and errors while aligning REST paths and RPC keys', () => {
  const contract = {
    list: baseContract.errors({ REFUSED: { status: 403 } })
      .route({ method: 'GET', path: '/items' }).output(SuccessSchema)
      .meta({ access: { authentication: 'required', authorization: { scopes: ['items:read'] } } }),
  };
  const mounted = mountPluginContract(contract, { version: 'v1', namespace: 'sample' });
  assertEquals(Object.keys(mounted), ['v1']);
  assertEquals(Object.keys(mounted.v1), ['sample']);
  assertEquals(Object.keys(mounted.v1.sample), ['list']);
  const procedure = mounted.v1.sample.list;
  assertEquals(procedure['~orpc'].route.path, '/v1/sample/items');
  assertEquals(procedure['~orpc'].meta, contract.list['~orpc'].meta);
  assertEquals(procedure['~orpc'].errorMap, contract.list['~orpc'].errorMap);
  assertNotStrictEquals(procedure, contract.list);
  assertEquals(contract.list['~orpc'].route.path, '/items');
});

Deno.test('contract mount rejects empty or slashed coordinates', () => {
  for (const segment of ['', '/', 'v1/sample', '/v1', 'v1/']) {
    assertThrows(
      () => mountPluginContract({}, { version: segment, namespace: 'sample' }),
      TypeError,
    );
    assertThrows(() => mountPluginContract({}, { version: 'v1', namespace: segment }), TypeError);
  }
});
