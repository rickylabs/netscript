import { Hono } from 'hono';
import type {
  TriggerEventStorePort,
  TriggerIngressPort,
} from '@netscript/plugin-triggers-core/ports';
import { createEventsRouter } from './routers/events.ts';
import { createHealthRouter } from './routers/health.ts';
import { createWebhookRouter } from './routers/webhooks.ts';

export type TriggersHttpRouterOptions = Readonly<{
  eventStore: TriggerEventStorePort;
  ingress: TriggerIngressPort;
}>;

/** Create the triggers HTTP router. */
export function createTriggersHttpRouter(options: TriggersHttpRouterOptions): Hono {
  const app = new Hono();

  app.route('/health', createHealthRouter());
  app.route('/api/v1/events', createEventsRouter({ eventStore: options.eventStore }));
  app.route('/api/v1/webhooks', createWebhookRouter({ ingress: options.ingress }));

  return app;
}
