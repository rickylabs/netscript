import { assertEquals, assertNotEquals } from 'jsr:@std/assert@^1';
import {
  allocateScaffoldDefaultPort,
  SCAFFOLD_DEFAULT_PORT_RANGE,
} from './default-port-allocation.ts';

Deno.test('scaffold default ports are stable, high, and resource-specific', () => {
  const first = allocateScaffoldDefaultPort('shop', 'service:users');
  assertEquals(allocateScaffoldDefaultPort('shop', 'service:users'), first);
  assertEquals(first >= SCAFFOLD_DEFAULT_PORT_RANGE.start, true);
  assertEquals(first <= SCAFFOLD_DEFAULT_PORT_RANGE.end, true);
  assertNotEquals(allocateScaffoldDefaultPort('shop', 'app:web'), first);
});

Deno.test('scaffold default port allocation probes occupied ports', () => {
  const first = allocateScaffoldDefaultPort('shop', 'service:users');
  const next = allocateScaffoldDefaultPort('shop', 'service:users', new Set([first]));
  const expected = first === SCAFFOLD_DEFAULT_PORT_RANGE.end
    ? SCAFFOLD_DEFAULT_PORT_RANGE.start
    : first + 1;
  assertEquals(next, expected);
});
