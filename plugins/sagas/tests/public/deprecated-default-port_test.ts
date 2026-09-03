import { assertEquals } from '@std/assert';
import { SAGAS_API_DEFAULT_PORT as rootPort } from '../../mod.ts';
import { SAGAS_API_DEFAULT_PORT as publicPort } from '../../src/public/mod.ts';
import { SAGAS_API_DEFAULT_PORT as runtimePort } from '../../src/runtime/mod.ts';
import { SAGAS_API_DEFAULT_PORT as aspirePort } from '../../src/aspire/mod.ts';

Deno.test('deprecated default-port compatibility export remains on all four entry points', () => {
  assertEquals([rootPort, publicPort, runtimePort, aspirePort], [8092, 8092, 8092, 8092]);
});
