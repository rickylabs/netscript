import { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core/builders';
import type { JobDefinition } from '@netscript/plugin-workers-core';

type HealthCheckPayload = Readonly<{
  verbose: boolean;
}>;

const workersPluginHealthCheckJob = {
  id: 'workers-plugin-health-check' as JobDefinition<'workers-plugin-health-check'>['id'],
  name: 'Workers Health Check',
  topic: 'default',
} satisfies JobDefinition<'workers-plugin-health-check'>;

/** Generic open webhook used by runtime scaffold and telemetry E2E gates. */
export const genericInboundWebhook = defineWebhook(
  () =>
    Promise.resolve([
      enqueueJob<'workers-plugin-health-check', HealthCheckPayload>(workersPluginHealthCheckJob, {
        payload: { verbose: false },
        priority: 50,
      }),
    ]),
  {
    id: 'generic-inbound-webhook' as const,
    path: 'inbound/generic',
    verifier: 'memory',
    description: 'Open webhook that enqueues the workers plugin health-check job.',
    tags: ['webhook', 'runtime-task', 'health-check'],
  },
);

export default genericInboundWebhook;
