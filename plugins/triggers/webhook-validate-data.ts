import { defineWebhook } from '@netscript/plugin-triggers-core/builders';

type ValidationPayload = Readonly<{
  recordId?: string;
  status?: string;
}>;

/** Sample webhook that accepts validation payloads without dispatching worker jobs. */
export const webhookValidateData = defineWebhook<'webhook-validate-data', ValidationPayload>(
  async () => [],
  {
    id: 'webhook-validate-data',
    path: 'validate/data',
    verifier: 'memory',
    description: 'Accept validation webhook payloads for scaffolded trigger examples.',
    tags: ['webhook', 'runtime-task', 'validate-data'],
  },
);

export default webhookValidateData;
