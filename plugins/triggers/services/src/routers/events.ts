import { Hono } from 'hono';
import {
  TRIGGER_EVENT_STATUSES,
  type TriggerEventId,
  type TriggerEventStatus,
  type TriggerId,
} from '@netscript/plugin-triggers-core/domain';
import type { TriggerEventStorePort } from '@netscript/plugin-triggers-core/ports';

export type EventsRouterOptions = Readonly<{
  eventStore: TriggerEventStorePort;
}>;

/** Create read-only trigger event routes backed by the event store port. */
export function createEventsRouter(options: EventsRouterOptions): Hono {
  const app = new Hono();

  app.get('/', async (c) => {
    const limit = parsePositiveInt(c.req.query('limit'), 50);
    const offset = parsePositiveInt(c.req.query('offset'), 0);
    const status = parseStatus(c.req.query('status'));

    if (limit === undefined || offset === undefined || status === null) {
      return c.json({
        error: 'invalid_query',
        message: 'Expected numeric limit/offset and a valid trigger event status.',
      }, 400);
    }

    const events = await options.eventStore.list({
      triggerId: c.req.query('triggerId') as TriggerId | undefined,
      status: status ?? undefined,
    });
    const page = events.slice(offset, offset + limit);

    return c.json({
      events: page,
      total: events.length,
      limit,
      offset,
    });
  });

  app.get('/:eventId', async (c) => {
    const event = await options.eventStore.load(c.req.param('eventId') as TriggerEventId);

    if (event === undefined) {
      return c.json({
        error: 'event_not_found',
        eventId: c.req.param('eventId'),
      }, 404);
    }

    return c.json({ event });
  });

  return app;
}

function parsePositiveInt(value: string | undefined, fallback: number): number | undefined {
  if (value === undefined || value.length === 0) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function parseStatus(value: string | undefined): TriggerEventStatus | undefined | null {
  if (value === undefined || value.length === 0) {
    return undefined;
  }
  return TRIGGER_EVENT_STATUSES.includes(value as TriggerEventStatus)
    ? value as TriggerEventStatus
    : null;
}
