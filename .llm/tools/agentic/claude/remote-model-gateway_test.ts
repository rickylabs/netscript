import { assertEquals, assertNotEquals, assertStrictEquals } from '@std/assert';
import {
  ANTHROPIC_API_BASE_URL,
  LOOPBACK_HOST,
  LOOPBACK_HTTP_PROTOCOL,
  OPENROUTER_ANTHROPIC_BASE_URL,
} from '../config/endpoints.ts';
import { OPENROUTER_MODEL_IDS } from '../config/models.ts';
import { createRemoteModelGatewayHandler } from './remote-model-gateway.ts';

const credential = 'SYNTHETIC_OPENROUTER_CREDENTIAL';
const oauth = 'SYNTHETIC_CLAUDE_OAUTH';
const localBase = `${LOOPBACK_HTTP_PROTOCOL}//${LOOPBACK_HOST}:43123`;

function handler(seen: Request[], response = new Response('ok')) {
  return createRemoteModelGatewayHandler({
    model: OPENROUTER_MODEL_IDS.deepseekV4Flash0731,
    openRouterApiKey: credential,
  }, {
    fetch: (request) => {
      seen.push(request);
      return Promise.resolve(response);
    },
  });
}

Deno.test('exact messages route forces model and isolates OpenRouter authentication', async () => {
  const seen: Request[] = [];
  const response = await handler(seen)(
    new Request(`${localBase}/v1/messages?beta=true`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${oauth}`,
        'x-api-key': oauth,
        connection: 'keep-alive, x-private-hop',
        'x-private-hop': 'remove-me',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ model: 'caller/model', messages: [] }),
    }),
  );
  assertEquals(response.status, 200);
  assertEquals(seen.length, 1);
  assertEquals(seen[0].url, `${OPENROUTER_ANTHROPIC_BASE_URL}/v1/messages?beta=true`);
  assertEquals(seen[0].headers.get('authorization'), `Bearer ${credential}`);
  assertEquals(seen[0].headers.has('x-api-key'), false);
  assertEquals(seen[0].headers.has('x-private-hop'), false);
  assertEquals((await seen[0].json()).model, OPENROUTER_MODEL_IDS.deepseekV4Flash0731);
});

Deno.test('all non-exact routes preserve Claude OAuth and cannot receive OpenRouter auth', async () => {
  const seen: Request[] = [];
  await handler(seen)(
    new Request(`${localBase}/v1/messages/controls?mode=remote`, {
      method: 'POST',
      headers: { authorization: `Bearer ${oauth}`, 'x-api-key': oauth },
      body: 'control-body',
    }),
  );
  assertEquals(seen[0].url, `${ANTHROPIC_API_BASE_URL}/v1/messages/controls?mode=remote`);
  assertEquals(seen[0].headers.get('authorization'), `Bearer ${oauth}`);
  assertEquals(seen[0].headers.get('x-api-key'), oauth);
  assertNotEquals(seen[0].headers.get('authorization'), `Bearer ${credential}`);
  assertEquals(await seen[0].text(), 'control-body');
});

Deno.test('malformed exact model requests fail closed without an upstream fetch', async () => {
  const seen: Request[] = [];
  const response = await handler(seen)(
    new Request(`${localBase}/v1/messages`, {
      method: 'POST',
      body: '{malformed',
    }),
  );
  assertEquals(response.status, 400);
  assertEquals(seen, []);
});

Deno.test('gateway returns the upstream streaming response without rebuilding it', async () => {
  const seen: Request[] = [];
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('data: first\n\n'));
      controller.close();
    },
  });
  const upstream = new Response(stream, {
    status: 207,
    headers: { 'content-type': 'text/event-stream' },
  });
  const response = await handler(seen, upstream)(
    new Request(`${localBase}/v1/messages`, {
      method: 'POST',
      body: JSON.stringify({ messages: [] }),
    }),
  );
  assertStrictEquals(response, upstream);
  assertStrictEquals(response.body, stream);
  assertEquals(response.status, 207);
});

Deno.test('a reflected OpenRouter credential is stripped from Anthropic passthrough', async () => {
  const seen: Request[] = [];
  await handler(seen)(
    new Request(`${localBase}/control`, {
      headers: { authorization: `Bearer ${credential}`, 'x-api-key': credential },
    }),
  );
  assertEquals(seen[0].headers.has('authorization'), false);
  assertEquals(seen[0].headers.has('x-api-key'), false);
});
