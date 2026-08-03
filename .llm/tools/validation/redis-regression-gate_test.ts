import { assert, assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import {
  REDIS_ADAPTER_PATH,
  removeRedisAtomicSerialization,
  requireRedisRegressionUrl,
} from './redis-regression-gate.ts';

Deno.test('Redis regression gate fails closed without a configured service URL', () => {
  assertThrows(
    () => requireRedisRegressionUrl(undefined),
    Error,
    'refusing silently skipped Redis tests',
  );
  assertThrows(
    () => requireRedisRegressionUrl('http://127.0.0.1:6379'),
    Error,
    'redis: or rediss:',
  );
  assertEquals(requireRedisRegressionUrl('redis://127.0.0.1:6379'), 'redis://127.0.0.1:6379');
});

Deno.test('Redis negative control removes exactly the #1075 serialization from current source', async () => {
  const source = await Deno.readTextFile(REDIS_ADAPTER_PATH);
  const preFix = removeRedisAtomicSerialization(source);
  assertStringIncludes(source, 'private atomicTail: Promise<void> = Promise.resolve()');
  assertStringIncludes(source, 'return await this.executeAtomic(checks, mutations)');
  assert(!preFix.includes('atomicTail'));
  assert(!preFix.includes('executeAtomic'));
  assertStringIncludes(preFix, 'const client = await this.connection.ensureClient()');
});

Deno.test('Redis negative control refuses source that no longer matches #1075 exactly', () => {
  assertThrows(
    () => removeRedisAtomicSerialization('export class RedisKvAdapter {}'),
    Error,
    'expected exactly one atomicTail field',
  );
});
