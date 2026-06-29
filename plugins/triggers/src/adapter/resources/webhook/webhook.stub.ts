/** Type-checked source stub for generated webhook triggers.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Type-checked webhook trigger stub with named substitution tokens. */
export const webhookStub: StubSource<'PATH' | 'SECRET_ENV_LINE' | 'TRIGGER_EXPORT' | 'TRIGGER_ID'> =
  defineStub({
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
    verifier: 'hmac-sha256'%%SECRET_ENV_LINE%%
  },
);

export default %%TRIGGER_EXPORT%%;
`,
    tokens: ['PATH', 'SECRET_ENV_LINE', 'TRIGGER_EXPORT', 'TRIGGER_ID'] as const,
  });
