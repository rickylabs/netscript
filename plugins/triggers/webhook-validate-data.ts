import { defineWebhook } from '@netscript/plugin-triggers-core/builders';
import type {
  TriggerContext,
  TriggerEvent,
  WebhookDefinition,
  WebhookTriggerPayload,
} from '@netscript/plugin-triggers-core/domain';

type ValidationPayload = Readonly<{
  recordId?: string;
  status?: string;
}>;

type WebhookValidateDataDefinition = WebhookDefinition<
  'webhook-validate-data',
  TriggerEvent<'webhook', WebhookTriggerPayload<ValidationPayload>>,
  TriggerContext
>;

/** Sample webhook that accepts validation payloads without dispatching worker jobs. */
export const webhookValidateData: WebhookValidateDataDefinition = defineWebhook<
  'webhook-validate-data',
  ValidationPayload
>(
  () => Promise.resolve([]),
  {
    id: 'webhook-validate-data',
    path: 'validate/data',
    verifier: 'memory',
    description: 'Accept validation webhook payloads for scaffolded trigger examples.',
    tags: ['webhook', 'runtime-task', 'validate-data'],
  },
);

export default webhookValidateData;
