import { assertEquals, assertRejects, assertStringIncludes, assertThrows } from '@std/assert';

import { DATABASE } from '../../../src/domain/extension-axes.ts';
import {
  assertExpectedListenerFailure,
  matchesExpectedFailure,
  observeInducedListenerDeparture,
  RESOURCE_TRANSITION_FAILURE_CEILING_MS,
} from '../../../src/application/gates/scaffold/runtime/listener-unreachable-fixture.ts';
import { createControlledFollower } from './controlled-follower.ts';
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

/**
 * The private Phase-B deadline that timed out Canary 6 (run 33684157301) on a stale Healthy report.
 * Retained only as the boundary the shared ceiling and the delayed-transition case must clear.
 */
const RETIRED_PHASE_B_POLL_DEADLINE_MS = 30_000;
/** Scale for the delayed-transition case: one unit stands for one second of the shared ceiling. */
const DELAY_SCALE = 1_000;
/** Test-failure ceiling for in-memory departure cases that must return on the event. */
const UNIT_WAIT_FAILURE_CEILING_MS = 2_000;
const APP_HOST = '/workspace/app/aspire/apphost.mts';

function postgresUpdate(
  healthStatus: 'Healthy' | 'Unhealthy',
  testOnly: Record<string, unknown>,
  realBacking: Record<string, unknown> = { status: 'Healthy' },
): string {
  return JSON.stringify({
    displayName: POSTGRES_EXPECTATION.resource,
    state: 'Running',
    healthStatus,
    healthReports: {
      [POSTGRES_EXPECTATION.healthCheckKey]: testOnly,
      [POSTGRES_EXPECTATION.realHealthCheckKey]: realBacking,
    },
  });
}

const HEALTHY_TEST_ONLY = { status: 'Healthy', description: 'tcp listener ready' };
const UNHEALTHY_TEST_ONLY = {
  status: 'Unhealthy',
  description: 'tcp listener unhealthy: ECONNREFUSED at localhost:18998 after 3 ms',
  data: { code: 'ECONNREFUSED' },
};

Deno.test('shared departure ceiling clears the retired Phase-B poll deadline', () => {
  assertEquals(RESOURCE_TRANSITION_FAILURE_CEILING_MS, 120_000);
  assertEquals(RESOURCE_TRANSITION_FAILURE_CEILING_MS > RETIRED_PHASE_B_POLL_DEADLINE_MS, true);
});

Deno.test('induced departure subscribes before the close command and returns on the event', async () => {
  const controlled = createControlledFollower();
  const order: string[] = [];
  let followerStarted = false;

  const evidence = await observeInducedListenerDeparture(
    APP_HOST,
    POSTGRES_EXPECTATION,
    async () => {
      order.push(followerStarted ? 'close-after-subscribe' : 'close-before-subscribe');
      await controlled.emit(postgresUpdate('Healthy', HEALTHY_TEST_ONLY));
      await controlled.emit(postgresUpdate('Unhealthy', UNHEALTHY_TEST_ONLY));
    },
    {
      ceilingMs: UNIT_WAIT_FAILURE_CEILING_MS,
      startFollower: () => {
        followerStarted = true;
        return controlled.follower;
      },
    },
  );

  assertEquals(order, ['close-after-subscribe']);
  assertEquals(evidence.source, 'follow-event');
  assertEquals(evidence.testOnly.status, 'Unhealthy');
  assertEquals(evidence.realBacking.status, 'Healthy');
  assertEquals(evidence.departureCeilingMs, UNIT_WAIT_FAILURE_CEILING_MS);
  assertEquals(controlled.wasKilled(), true);
});

Deno.test('induced departure waits past the retired 30s boundary when Aspire re-evaluates late', async () => {
  // Scaled 1:1000 so the case stays deterministic: a departure emitted at "45s" (45 ms) must be
  // accepted under the "120s" (120 ms) ceiling although it lies well beyond the retired "30s".
  const scaledCeilingMs = RESOURCE_TRANSITION_FAILURE_CEILING_MS / DELAY_SCALE;
  const scaledDepartureMs = 45_000 / DELAY_SCALE;
  assertEquals(scaledDepartureMs > RETIRED_PHASE_B_POLL_DEADLINE_MS / DELAY_SCALE, true);
  assertEquals(scaledDepartureMs < scaledCeilingMs, true);

  const controlled = createControlledFollower();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const evidence = await observeInducedListenerDeparture(
      APP_HOST,
      POSTGRES_EXPECTATION,
      async () => {
        // Aspire keeps reporting the stale Healthy state for a while after the close is acked.
        await controlled.emit(postgresUpdate('Healthy', HEALTHY_TEST_ONLY));
        timer = setTimeout(() => {
          void controlled.emit(postgresUpdate('Unhealthy', UNHEALTHY_TEST_ONLY));
        }, scaledDepartureMs);
      },
      { ceilingMs: scaledCeilingMs, startFollower: () => controlled.follower },
    );
    assertEquals(evidence.testOnly.status, 'Unhealthy');
    assertEquals(evidence.realBacking.status, 'Healthy');
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
});

Deno.test('induced departure fails non-vacuously when only stale Healthy is ever reported', async () => {
  const controlled = createControlledFollower();
  const error = await assertRejects(
    () =>
      observeInducedListenerDeparture(
        APP_HOST,
        POSTGRES_EXPECTATION,
        () => controlled.emit(postgresUpdate('Healthy', HEALTHY_TEST_ONLY)),
        { ceilingMs: 20, startFollower: () => controlled.follower },
      ),
    Error,
    'test-failure ceiling for a hung stream',
  );
  assertStringIncludes(error.message, '20ms');
  assertEquals(controlled.wasKilled(), true);
});

Deno.test('induced departure rejects when the real backing check leaves Healthy', async () => {
  const controlled = createControlledFollower();
  await assertRejects(
    () =>
      observeInducedListenerDeparture(
        APP_HOST,
        POSTGRES_EXPECTATION,
        () =>
          controlled.emit(
            postgresUpdate('Unhealthy', UNHEALTHY_TEST_ONLY, {
              status: 'Unhealthy',
              description: 'real backing changed',
            }),
          ),
        { ceilingMs: UNIT_WAIT_FAILURE_CEILING_MS, startFollower: () => controlled.follower },
      ),
    Error,
    'real backing health postgres_listener changed to Unhealthy',
  );
});

Deno.test('induced departure requires the structured socket failure code', async () => {
  const controlled = createControlledFollower();
  await assertRejects(
    () =>
      observeInducedListenerDeparture(
        APP_HOST,
        POSTGRES_EXPECTATION,
        () =>
          controlled.emit(
            postgresUpdate('Unhealthy', {
              status: 'Unhealthy',
              description: 'tcp listener unhealthy: EPROTO',
              data: { code: 'EPROTO' },
            }),
          ),
        { ceilingMs: UNIT_WAIT_FAILURE_CEILING_MS, startFollower: () => controlled.follower },
      ),
    Error,
    'neither its failure code nor its description names ECONNREFUSED or ETIMEDOUT',
  );
});
