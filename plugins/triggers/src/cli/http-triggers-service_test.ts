import { assertEquals, assertRejects } from '@std/assert';
import { HttpTriggersService } from './http-triggers-service.ts';

Deno.test('HTTP triggers service reads persisted events with filters', async () => {
  const requests: Request[] = [];
  const client = new HttpTriggersService({
    baseUrl: 'http://triggers.test/api/v1',
    fetch: (input, init) => {
      requests.push(new Request(input, init));
      return Promise.resolve(Response.json({
        events: [{ id: 'evt-1', triggerId: 'payment-webhook', status: 'completed' }],
        total: 1,
        limit: 7,
        offset: 0,
      }));
    },
  });

  const page = await client.listEvents({
    triggerId: 'payment-webhook',
    status: 'completed',
    limit: 7,
  });

  assertEquals(page.total, 1);
  assertEquals(page.events[0]?.id, 'evt-1');
  assertEquals(
    requests[0]?.url,
    'http://triggers.test/api/v1/events?triggerId=payment-webhook&status=completed&limit=7',
  );
  assertEquals(requests[0]?.method, 'GET');
});

Deno.test('HTTP triggers service reads authoritative enabled definitions', async () => {
  let requested = '';
  const client = new HttpTriggersService({
    baseUrl: 'http://triggers.test/api/v1',
    fetch: (input) => {
      requested = String(input);
      return Promise.resolve(Response.json({
        triggers: [{ id: 'payment-webhook', enabled: true }],
        total: 1,
        limit: 50,
        offset: 0,
      }));
    },
  });

  assertEquals(await client.listTriggers(true), [{ id: 'payment-webhook', enabled: true }]);
  assertEquals(requested, 'http://triggers.test/api/v1/triggers/triggers?enabled=true');
});

Deno.test('HTTP triggers service calls authoritative enable and disable routes', async () => {
  const requests: Request[] = [];
  const client = new HttpTriggersService({
    baseUrl: 'http://triggers.test/api/v1/',
    fetch: (input, init) => {
      const request = new Request(input, init);
      requests.push(request);
      return Promise.resolve(Response.json({
        id: 'payment/webhook',
        enabled: request.url.endsWith('/enable'),
      }));
    },
  });

  assertEquals(await client.setEnabled('payment/webhook', false), {
    id: 'payment/webhook',
    enabled: false,
  });
  assertEquals(await client.setEnabled('payment/webhook', true), {
    id: 'payment/webhook',
    enabled: true,
  });
  assertEquals(requests.map((request) => request.method), ['POST', 'POST']);
  assertEquals(requests.map((request) => request.url), [
    'http://triggers.test/api/v1/triggers/triggers/payment%2Fwebhook/disable',
    'http://triggers.test/api/v1/triggers/triggers/payment%2Fwebhook/enable',
  ]);
});

Deno.test('HTTP triggers service reports unreachable and non-success responses', async () => {
  const unreachable = new HttpTriggersService({
    fetch: () => Promise.reject(new Error('connection refused')),
  });
  await assertRejects(
    () => unreachable.listEvents(),
    Error,
    'Unable to reach triggers service',
  );

  const rejected = new HttpTriggersService({
    fetch: () =>
      Promise.resolve(Response.json({ message: 'Trigger is disabled.' }, { status: 409 })),
  });
  await assertRejects(
    () => rejected.setEnabled('payment-webhook', false),
    Error,
    'Triggers service 409: Trigger is disabled.',
  );
});
