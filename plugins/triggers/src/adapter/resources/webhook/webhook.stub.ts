/** Type-checked source stub for generated webhook triggers.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Type-checked webhook trigger stub with named substitution tokens. */
export const webhookStub: StubSource<
  'PATH' | 'SECRET_ENV_LINE' | 'TRIGGER_EXPORT' | 'TRIGGER_ID' | 'VERIFIER'
> = defineStub({
  source: `import { defineWebhook } from '@netscript/plugin-triggers-core/builders';
import type {
  TriggerContext,
  TriggerEvent,
  WebhookDefinition,
  WebhookTriggerPayload,
} from '@netscript/plugin-triggers-core/domain';

/**
 * Starter inbound-webhook trigger for %%TRIGGER_ID%%.
 */
export const %%TRIGGER_EXPORT%%: WebhookDefinition<
  '%%TRIGGER_ID%%',
  TriggerEvent<'webhook', WebhookTriggerPayload<unknown>>,
  TriggerContext
> = defineWebhook(
  // deno-lint-ignore require-await -- starter handler; the runtime contract is async.
  async () => {
    return [];
  },
  {
    id: '%%TRIGGER_ID%%',
    path: '%%PATH%%',
    verifier: '%%VERIFIER%%'%%SECRET_ENV_LINE%%
  },
);

export default %%TRIGGER_EXPORT%%;
`,
  tokens: ['PATH', 'SECRET_ENV_LINE', 'TRIGGER_EXPORT', 'TRIGGER_ID', 'VERIFIER'] as const,
});

/** Default installed webhook used by scaffold runtime and OTEL smoke gates. */
export const starterWebhookStub: StubSource<
  'PATH' | 'SECRET_ENV_LINE' | 'TRIGGER_EXPORT' | 'TRIGGER_ID' | 'VERIFIER'
> = defineStub({
  source: `import { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core/builders';
import type {
  TriggerContext,
  TriggerEvent,
  WebhookDefinition,
  WebhookTriggerPayload,
} from '@netscript/plugin-triggers-core/domain';
import type { JobDefinition } from '@netscript/plugin-workers-core';

type HealthCheckPayload = Readonly<{
  verbose: boolean;
}>;

const workersPluginHealthCheckJob = {
  id: 'workers-plugin-health-check' as JobDefinition<'workers-plugin-health-check'>['id'],
  name: 'Workers Health Check',
  topic: 'default',
} satisfies JobDefinition<'workers-plugin-health-check'>;

/**
 * Starter inbound-webhook trigger for %%TRIGGER_ID%%.
 */
export const %%TRIGGER_EXPORT%%: WebhookDefinition<
  '%%TRIGGER_ID%%',
  TriggerEvent<'webhook', WebhookTriggerPayload<unknown>>,
  TriggerContext
> = defineWebhook(
  () =>
    Promise.resolve([
      enqueueJob<'workers-plugin-health-check', HealthCheckPayload>(workersPluginHealthCheckJob, {
        payload: { verbose: false },
        priority: 50,
      }),
    ]),
  {
    id: '%%TRIGGER_ID%%',
    path: '%%PATH%%',
    verifier: '%%VERIFIER%%'%%SECRET_ENV_LINE%%,
    description: 'Open webhook that enqueues the workers plugin health-check job.',
    tags: ['webhook', 'runtime-task', 'health-check'],
  },
);

export default %%TRIGGER_EXPORT%%;
`,
  tokens: ['PATH', 'SECRET_ENV_LINE', 'TRIGGER_EXPORT', 'TRIGGER_ID', 'VERIFIER'] as const,
});
