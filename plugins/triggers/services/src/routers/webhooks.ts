import { type Context, Hono } from 'hono';
import { type TriggerId, TriggersError } from '@netscript/plugin-triggers-core/domain';
import type { TriggerIngressPort } from '@netscript/plugin-triggers-core/ports';

export type WebhookRouterOptions = Readonly<{
  ingress: TriggerIngressPort;
}>;

/** Create raw webhook routes backed by the trigger ingress port. */
export function createWebhookRouter(options: WebhookRouterOptions): Hono {
  const app = new Hono();

  app.post('/:triggerId', async (c) => {
    const triggerId = resolveWebhookTarget(c.req.path, c.req.param('triggerId'));
    return await acceptWebhook(c, options.ingress, triggerId);
  });

  app.post('/:triggerId/*', async (c) => {
    const triggerId = resolveWebhookTarget(c.req.path, c.req.param('triggerId'), c.req.param('*'));
    return await acceptWebhook(c, options.ingress, triggerId);
  });

  return app;
}

async function acceptWebhook(
  c: Context,
  ingress: TriggerIngressPort,
  triggerId: string,
): Promise<Response> {
  try {
    const response = await ingress.accept({
      triggerId: triggerId as TriggerId,
      request: c.req.raw,
    });

    return c.json({
      accepted: true,
      status: response.status,
      acceptedAt: response.acceptedAt,
      eventId: response.event?.id,
      triggerId: response.event?.triggerId,
    }, response.status);
  } catch (error) {
    const failure = webhookFailure(error);
    return c.json({
      accepted: false,
      status: failure.status,
      error: failure.code,
      message: failure.message,
    }, failure.status);
  }
}

function resolveWebhookTarget(path: string, triggerId: string, wildcard?: string): string {
  const marker = '/api/v1/webhooks/';
  const markerIndex = path.indexOf(marker);
  if (markerIndex >= 0) {
    return decodeURIComponent(path.slice(markerIndex + marker.length));
  }
  return wildcard ? `${triggerId}/${wildcard}` : triggerId;
}

function webhookFailure(error: unknown): Readonly<{
  status: 400 | 401 | 404 | 500;
  code: string;
  message: string;
}> {
  if (error instanceof TriggersError) {
    if (error.code === 'TRIGGER_NOT_FOUND') {
      return { status: 404, code: error.code, message: error.message };
    }
    if (error.code === 'TRIGGER_VALIDATION_FAILED') {
      const verificationFailed = error.message.includes('Webhook verification failed');
      return {
        status: verificationFailed ? 401 : 400,
        code: error.code,
        message: error.message,
      };
    }
    return { status: 400, code: error.code, message: error.message };
  }
  return {
    status: 500,
    code: 'TRIGGER_WEBHOOK_FAILED',
    message: error instanceof Error ? error.message : 'Webhook request failed.',
  };
}
