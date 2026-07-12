import type { Context } from 'hono';
import { type TriggerEventStatus, TriggersError } from '@netscript/plugin-triggers-core/domain';
import type {
  ProcessableTriggerDefinition,
  TriggerEnabledStatePort,
  TriggerEventStorePort,
  TriggerIngressPort,
} from '@netscript/plugin-triggers-core/ports';
import type { WebhookDefinition } from '@netscript/plugin-triggers-core/domain';

/** External path prefix preserved for raw webhook ingress. */
export const WEBHOOK_PATH_PREFIX = '/api/v1/webhooks/' as const;

/** Return a filtered page from the persisted trigger event ledger. */
export async function listTriggerEvents(
  c: Context,
  eventStore: TriggerEventStorePort,
): Promise<Response> {
  const limit = parsePositiveInteger(c.req.query('limit'), 50);
  const offset = parseNonNegativeInteger(c.req.query('offset'), 0);
  const triggerId = c.req.query('triggerId');
  const status = c.req.query('status');
  const all = await eventStore.list({ status: toTriggerEventStatus(status) });
  const matched = triggerId === undefined
    ? all
    : all.filter((event) => event.triggerId === triggerId);
  const events = matched.slice(offset, offset + limit);
  return c.json({ events, total: matched.length, limit, offset });
}

/** Accept a raw webhook only when its code definition exists and is enabled. */
export async function acceptWebhook(
  c: Context,
  ingress: TriggerIngressPort,
  definitions: readonly ProcessableTriggerDefinition[],
  enabledState: TriggerEnabledStatePort,
): Promise<Response> {
  const target = resolveWebhookTarget(c.req.path);
  const definition = resolveWebhookDefinition(definitions, target);
  if (definition === undefined) {
    return c.json({
      accepted: false,
      status: 404,
      error: 'TRIGGER_NOT_FOUND',
      message: `Trigger ${target} not found.`,
    }, 404);
  }
  if (!await enabledState.isEnabled(definition.id)) {
    return c.json({
      accepted: false,
      status: 409,
      error: 'TRIGGER_DISABLED',
      message: `Trigger ${definition.id} is disabled.`,
    }, 409);
  }
  try {
    const response = await ingress.accept({
      triggerId: definition.id,
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

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function toTriggerEventStatus(value: string | undefined): TriggerEventStatus | undefined {
  if (
    value === 'pending' || value === 'in-flight' || value === 'deferred' ||
    value === 'completed' || value === 'failed' || value === 'dlq'
  ) {
    return value;
  }
  return undefined;
}

function resolveWebhookTarget(path: string): string {
  const markerIndex = path.indexOf(WEBHOOK_PATH_PREFIX);
  return markerIndex >= 0
    ? decodeURIComponent(path.slice(markerIndex + WEBHOOK_PATH_PREFIX.length))
    : path;
}

function resolveWebhookDefinition(
  definitions: readonly ProcessableTriggerDefinition[],
  target: string,
): ProcessableTriggerDefinition | undefined {
  const normalizedTarget = normalizeWebhookPath(target);
  return definitions.find((definition) =>
    definition.id === target ||
    (isWebhookDefinition(definition) && normalizeWebhookPath(definition.path) === normalizedTarget)
  );
}

function normalizeWebhookPath(path: string): string {
  return path.replace(/^\/+/, '').replace(/\/+$/, '');
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

function isWebhookDefinition(
  definition: ProcessableTriggerDefinition,
): definition is WebhookDefinition<string, never, never> {
  return definition.kind === 'webhook';
}
