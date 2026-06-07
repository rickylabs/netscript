import { assertEquals } from 'jsr:@std/assert@1';
import { inferCapabilities } from '../src/adapter.ts';

Deno.test('inferCapabilities enables relation joins for supported MySQL versions', () => {
  assertEquals(inferCapabilities('8.0.13'), { supportsRelationJoins: true });
  assertEquals(inferCapabilities('8.4.0'), { supportsRelationJoins: true });
});

Deno.test('inferCapabilities disables relation joins for old MySQL and MariaDB', () => {
  assertEquals(inferCapabilities('5.7.44'), { supportsRelationJoins: false });
  assertEquals(inferCapabilities('10.11.8-MariaDB'), { supportsRelationJoins: false });
  assertEquals(inferCapabilities(undefined), { supportsRelationJoins: false });
});
