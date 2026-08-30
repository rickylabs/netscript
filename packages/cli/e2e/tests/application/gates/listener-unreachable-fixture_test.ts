import { assertEquals, assertThrows } from '@std/assert';

import {
  HEALTHY_WAIT_TIMEOUT_EXIT_CODE,
  requireHealthyWaitTimeout,
} from '../../../src/application/gates/scaffold/runtime/listener-unreachable-fixture.ts';

const POSTGRES_TIMEOUT_DIAGNOSTIC =
  "Timed out waiting for resource 'postgres' to be healthy after 10s.";

Deno.test('listener recovery requires the running-unhealthy wait timeout contract', () => {
  assertEquals(HEALTHY_WAIT_TIMEOUT_EXIT_CODE, 17);
  assertEquals(
    requireHealthyWaitTimeout('postgres', 10, {
      code: HEALTHY_WAIT_TIMEOUT_EXIT_CODE,
      stdout: '',
      stderr: `❌ ${POSTGRES_TIMEOUT_DIAGNOSTIC}`,
    }),
    POSTGRES_TIMEOUT_DIAGNOSTIC,
  );
});

Deno.test('listener recovery rejects terminal-state exit 18 for the timeout path', () => {
  assertThrows(
    () =>
      requireHealthyWaitTimeout('postgres', 10, {
        code: 18,
        stdout: '',
        stderr: POSTGRES_TIMEOUT_DIAGNOSTIC,
      }),
    Error,
    'expected exit 17',
  );
});

Deno.test('listener recovery requires the exact timeout diagnostic', () => {
  assertThrows(
    () =>
      requireHealthyWaitTimeout('postgres', 10, {
        code: HEALTHY_WAIT_TIMEOUT_EXIT_CODE,
        stdout: '',
        stderr: `${POSTGRES_TIMEOUT_DIAGNOSTIC} Retrying.`,
      }),
    Error,
    POSTGRES_TIMEOUT_DIAGNOSTIC,
  );
});
