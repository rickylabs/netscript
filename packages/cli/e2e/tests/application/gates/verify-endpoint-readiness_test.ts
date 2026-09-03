import { assertEquals, assertRejects } from '@std/assert';

import {
  verifyEndpointReadiness,
} from '../../../src/application/gates/scaffold/verify-endpoint-readiness.ts';
import type {
  ResourceUpdate,
  ResourceUpdateSubscription,
} from '../../../src/application/gates/scaffold/runtime/resource-state-stream.ts';

Deno.test('failed readiness uses the event as detector then reads one detailed snapshot', async () => {
  const calls: string[] = [];
  const { subscription, closeCount } = fakeSubscription([
    update({ displayName: 'readiness-dead-port', state: 'Running', healthStatus: 'Unhealthy' }),
  ], calls);

  const observed = await verifyEndpointReadiness(
    '/workspace/aspire/apphost.mts',
    () => {
      calls.push('watch');
      return Promise.resolve(subscription);
    },
    () => {
      calls.push('snapshot');
      return Promise.resolve(JSON.stringify({
        resources: [{
          displayName: 'readiness-dead-port',
          state: 'Running',
          healthStatus: 'Unhealthy',
          healthReports: [{ status: 'Unhealthy', description: 'connection refused' }],
        }],
      }));
    },
  );

  assertEquals(observed, 'Running / Unhealthy / 1 reports');
  assertEquals(calls, ['watch', 'wait', 'snapshot', 'close']);
  assertEquals(closeCount(), 1);
});

Deno.test('failed readiness distinguishes an absent transition from wrong settled evidence', async () => {
  const absent = fakeSubscription([], [], new Error('synthetic follower ended'));
  await assertRejects(
    () =>
      verifyEndpointReadiness(
        '/workspace/aspire/apphost.mts',
        () => Promise.resolve(absent.subscription),
        () => Promise.reject(new Error('snapshot must not run')),
      ),
    Error,
    'did not observe readiness-dead-port transition to Unhealthy',
  );
  assertEquals(absent.closeCount(), 1);

  const wrong = fakeSubscription([
    update({ displayName: 'readiness-dead-port', state: 'Running', healthStatus: 'Unhealthy' }),
  ]);
  await assertRejects(
    () =>
      verifyEndpointReadiness(
        '/workspace/aspire/apphost.mts',
        () => Promise.resolve(wrong.subscription),
        () =>
          Promise.resolve(JSON.stringify({
            resources: [{
              displayName: 'readiness-dead-port',
              state: 'Running',
              healthStatus: 'Unhealthy',
              healthReports: [],
            }],
          })),
      ),
    Error,
    'observed readiness-dead-port Unhealthy, but its evidence was wrong',
  );
  assertEquals(wrong.closeCount(), 1);
});

function fakeSubscription(
  updates: readonly ResourceUpdate[],
  calls: string[] = [],
  terminal: Error = new Error('synthetic stream had no matching update'),
): { subscription: ResourceUpdateSubscription; closeCount: () => number } {
  let closes = 0;
  return {
    subscription: {
      waitFor(predicate) {
        calls.push('wait');
        const match = updates.find(predicate);
        return match ? Promise.resolve(match) : Promise.reject(terminal);
      },
      close() {
        calls.push('close');
        closes += 1;
        return Promise.resolve();
      },
    },
    closeCount: () => closes,
  };
}

function update(resource: Record<string, unknown>): ResourceUpdate {
  return { resource, rawLine: JSON.stringify(resource) };
}
