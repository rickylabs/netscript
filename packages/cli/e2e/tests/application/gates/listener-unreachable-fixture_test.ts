import { assertEquals, assertThrows } from '@std/assert';

import { DATABASE } from '../../../src/domain/extension-axes.ts';
import {
  assertExpectedListenerFailure,
  matchesExpectedFailure,
} from '../../../src/application/gates/scaffold/runtime/listener-unreachable-fixture.ts';
import {
  type ListenerFaultExpectation,
  listenerFaultExpectations,
} from '../../../src/application/gates/scaffold/runtime/listener-readiness-gates.ts';
import type { ListenerHealthReport } from '../../../src/application/gates/scaffold/runtime/verify-listener-readiness.ts';

const POSTGRES_EXPECTATION = listenerFaultExpectations(DATABASE.POSTGRES)[0];

Deno.test('listener failure accepts the structured socket code independent of prose', () => {
  assertExpectedListenerFailure({
    resourceName: 'postgres',
    healthCheckKey: 'test_only_postgres_listener',
    status: 'Unhealthy',
    description: 'diagnostic wording may change without breaking the gate',
    data: { code: 'ECONNREFUSED' },
  }, POSTGRES_EXPECTATION);
});

Deno.test('listener failure gives the structured code precedence over matching prose', () => {
  assertThrows(
    () =>
      assertExpectedListenerFailure({
        resourceName: 'postgres',
        healthCheckKey: 'test_only_postgres_listener',
        status: 'Unhealthy',
        description: 'tcp listener unhealthy: ECONNREFUSED',
        data: { code: 'EPROTO' },
      }, POSTGRES_EXPECTATION),
    Error,
    'neither its failure code nor its description',
  );
});

Deno.test('listener failure retains the wording-tolerant description fallback', () => {
  assertExpectedListenerFailure({
    resourceName: 'postgres',
    healthCheckKey: 'test_only_postgres_listener',
    status: 'Unhealthy',
    description: 'tcp listener unreachable: ETIMEDOUT at localhost:18998',
  }, POSTGRES_EXPECTATION);
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

  await t.step('a Healthy report is rejected even with an expected structured code', () => {
    assertEquals(
      matchesExpectedFailure(
        report('Healthy', 'RESP listener ready on localhost:18999', { code: 'ECONNREFUSED' }),
        GARNET_EXPECTATION,
      ),
      false,
    );
  });

  await t.step('a Healthy report is rejected even with a matching description', () => {
    assertEquals(
      matchesExpectedFailure(
        report('Healthy', 'RESP listener unhealthy: ECONNREFUSED at localhost:18999 after 2 ms'),
        GARNET_EXPECTATION,
      ),
      false,
    );
  });

  await t.step('a punctuation-suffixed code is rejected by the fallback', () => {
    for (
      const description of [
        'RESP listener unhealthy: ECONNREFUSED.',
        'RESP listener unhealthy: ECONNREFUSED: actually EPROTO',
        'RESP listener unhealthy: ECONNREFUSED-ish',
        'RESP listener unhealthy: ETIMEDOUT,',
      ]
    ) {
      assertEquals(
        matchesExpectedFailure(report('Unhealthy', description), GARNET_EXPECTATION),
        false,
      );
    }
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
