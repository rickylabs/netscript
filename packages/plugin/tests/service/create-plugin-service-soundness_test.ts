import { assertEquals } from '@std/assert';
import type { PluginServiceConfig } from '../../src/service/mod.ts';

Deno.test('plugin service configuration requires an explicit complete auth posture', () => {
  // @ts-expect-error Plugin services must explicitly choose guards or public access.
  const missing: PluginServiceConfig = { name: 'missing' };
  // @ts-expect-error Public access requires a nonblank reason at runtime and a string at compile time.
  const reasonless: PluginServiceConfig = { name: 'reasonless', auth: { public: true } };
  assertEquals([missing, reasonless].length, 2);
});
