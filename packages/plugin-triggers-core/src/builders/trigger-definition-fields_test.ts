import { assertEquals } from '@std/assert';
import { defineFileWatch, defineScheduledTrigger, defineWebhook } from './mod.ts';

Deno.test('trigger builders preserve optional name and enabled fields', () => {
  const webhook = defineWebhook(() => Promise.resolve([]), {
    id: 'webhook-orders',
    path: '/orders',
    verifier: 'memory',
    name: 'Orders Webhook',
    enabled: false,
  });
  const scheduled = defineScheduledTrigger(() => Promise.resolve([]), {
    id: 'scheduled-orders',
    cron: '0 * * * *',
    name: 'Orders Schedule',
    enabled: true,
  });
  const fileWatch = defineFileWatch(() => Promise.resolve([]), {
    id: 'file-orders',
    paths: ['/var/orders'],
    patterns: ['*.json'],
    on: ['create'],
    name: 'Orders File Watch',
    enabled: false,
  });

  assertEquals(webhook.name, 'Orders Webhook');
  assertEquals(webhook.enabled, false);
  assertEquals(scheduled.name, 'Orders Schedule');
  assertEquals(scheduled.enabled, true);
  assertEquals(fileWatch.name, 'Orders File Watch');
  assertEquals(fileWatch.enabled, false);
  assertEquals(Object.isFrozen(webhook), true);
  assertEquals(Object.isFrozen(scheduled), true);
  assertEquals(Object.isFrozen(fileWatch), true);
});
