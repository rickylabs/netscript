import { assertEquals, assertThrows } from '@std/assert';

import {
  HEALTHY_WAIT_TIMEOUT_EXIT_CODE,
  matchesExpectedFailure,
  requireHealthyWaitTimeout,
} from '../../../src/application/gates/scaffold/runtime/listener-unreachable-fixture.ts';
import type { ListenerFaultExpectation } from '../../../src/application/gates/scaffold/runtime/listener-readiness-gates.ts';
import type { ListenerHealthReport } from '../../../src/application/gates/scaffold/runtime/verify-listener-readiness.ts';

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

Deno.test('listener recovery accepts the ANSI-decorated Aspire 13.5.3 timeout line', () => {
  assertEquals(
    requireHealthyWaitTimeout('postgres', 10, {
      code: HEALTHY_WAIT_TIMEOUT_EXIT_CODE,
      stdout: '',
      stderr: `\x1b[31m\x1b[1m❌\x1b[22m \x1b[31m${POSTGRES_TIMEOUT_DIAGNOSTIC}\x1b[39m\x1b[0m`,
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

const GARNET_EXPECTATION = { controllerListener: 'garnet' } as ListenerFaultExpectation;

function report(
  status: string,
  description?: string,
  data?: unknown,
): ListenerHealthReport {
  return {
    resourceName: 'garnet',
    healthCheckKey: 'test_only_garnet_resp',
    status,
    ...(description === undefined ? {} : { description }),
    ...(data === undefined ? {} : { data }),
  };
}

Deno.test('expected-failure matcher accepts only a genuine expected socket failure', async (t) => {
  await t.step('structured code wins and accepts an expected failure', () => {
    assertEquals(
      matchesExpectedFailure(
        report('Unhealthy', 'RESP listener unhealthy: ECONNREFUSED at localhost:18999 after 2 ms', {
          code: 'ECONNREFUSED',
        }),
        GARNET_EXPECTATION,
      ),
      true,
    );
  });

  await t.step('an unexpected structured code is rejected even when the prose matches', () => {
    assertEquals(
      matchesExpectedFailure(
        report('Unhealthy', 'RESP listener unhealthy: ECONNREFUSED', { code: 'EPROTO' }),
        GARNET_EXPECTATION,
      ),
      false,
    );
  });

  await t.step('a malformed structured code fails closed rather than falling back', () => {
    assertEquals(
      matchesExpectedFailure(
        report('Unhealthy', 'RESP listener unhealthy: ECONNREFUSED', { code: 17 }),
        GARNET_EXPECTATION,
      ),
      false,
    );
  });

  await t.step('a prefixed code token is not accepted by the fallback', () => {
    assertEquals(
      matchesExpectedFailure(
        report('Unhealthy', 'RESP listener unhealthy: ECONNREFUSED_BOGUS'),
        GARNET_EXPECTATION,
      ),
      false,
    );
  });

  await t.step('a misleading received payload cannot mask a wrong failure', () => {
    assertEquals(
      matchesExpectedFailure(
        report(
          'Unhealthy',
          'RESP listener unhealthy: EPROTO at localhost:18999 after 2 ms; ' +
            'received="RESP listener unhealthy: ECONNREFUSED"',
        ),
        GARNET_EXPECTATION,
      ),
      false,
    );
  });

  await t.step('an unexpected fallback code is rejected', () => {
    assertEquals(
      matchesExpectedFailure(
        report('Unhealthy', 'RESP listener unhealthy: EPROTO'),
        GARNET_EXPECTATION,
      ),
      false,
    );
  });

  await t.step('the fallback still accepts both producer wordings', () => {
    for (
      const description of [
        'RESP listener unreachable: ECONNREFUSED',
        'RESP listener unhealthy: ETIMEDOUT at localhost:18999 after 2000 ms; received=""',
      ]
    ) {
      assertEquals(
        matchesExpectedFailure(report('Unhealthy', description), GARNET_EXPECTATION),
        true,
      );
    }
  });
});
