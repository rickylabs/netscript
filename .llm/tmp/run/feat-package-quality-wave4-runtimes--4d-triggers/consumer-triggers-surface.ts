import {
  defineScheduledTrigger,
  defineWebhook,
} from '../../../../packages/plugin-triggers-core/mod.ts';
import {
  inspectTriggers,
  triggersPlugin,
  type TriggersPluginInspection,
} from '../../../../plugins/triggers/mod.ts';

const webhook = defineWebhook(
  () => Promise.resolve([]),
  {
    id: 'consumer.webhook',
    path: '/hooks/consumer',
    verifier: 'memory',
  },
);

const scheduled = defineScheduledTrigger(
  () => Promise.resolve([]),
  {
    id: 'consumer.schedule',
    cron: '*/5 * * * *',
  },
);

const inspection: TriggersPluginInspection = inspectTriggers(triggersPlugin);

void webhook;
void scheduled;
void inspection;
