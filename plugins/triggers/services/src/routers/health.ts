import { Hono } from 'hono';
import { TRIGGERS_API_SERVICE_NAME, TRIGGERS_PLUGIN_VERSION } from '../../../src/constants.ts';

export type HealthRouterOptions = Readonly<{
  startedAt?: Date;
}>;

/** Create process-local health and readiness routes. */
export function createHealthRouter(options: HealthRouterOptions = {}): Hono {
  const app = new Hono();
  const startedAt = options.startedAt ?? new Date();

  app.get('/', (c) =>
    c.json({
      status: 'healthy',
      service: TRIGGERS_API_SERVICE_NAME,
      version: TRIGGERS_PLUGIN_VERSION,
      timestamp: new Date().toISOString(),
      uptimeMs: Date.now() - startedAt.getTime(),
    }));

  app.get('/ready', (c) =>
    c.json({
      ready: true,
      service: TRIGGERS_API_SERVICE_NAME,
      timestamp: new Date().toISOString(),
    }));

  app.get('/ping', (c) =>
    c.json({
      message: 'pong',
      timestamp: new Date().toISOString(),
    }));

  return app;
}
