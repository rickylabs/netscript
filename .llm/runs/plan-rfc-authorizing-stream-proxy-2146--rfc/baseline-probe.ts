/**
 * Runnable synthetic baseline probe for rickylabs/netscript#2146 (RFC 0000).
 *
 * Verifies current `main` behavior against shipped workspace modules and an
 * ephemeral loopback `DurableStreamTestServer`:
 * 1. `createNetScriptChatStreamProxy` admits GET without an auth hook and
 *    forwards client `Cookie` headers upstream by default.
 * 2. `createContractAuthorizer` rejects parameterized paths in `rawRoutes`.
 * 3. `createNetScriptStreamEventSourceV1` unconditionally prepends
 *    `/v1/stream/netscript` via `buildStreamUrl`.
 * 4. `DurableStreamTestServer` serves `live=sse` with `text/event-stream`,
 *    wildcard `access-control-allow-origin: *`, paired `event: data` +
 *    `event: control` (`streamNextOffset`), no SSE `id:` field, clean
 *    `?offset=` resume, and HTTP `404` on not-yet-created streams.
 *
 * Run from repository root:
 *   deno run -A --frozen \
 *     .llm/runs/plan-rfc-authorizing-stream-proxy-2146--rfc/baseline-probe.ts
 */

import { DurableStreamTestServer } from 'npm:@durable-streams/server@0.3.9';
import { getAvailablePort } from 'jsr:@std/net@^1';
import { buildStreamUrl, createDurableStream } from '../../../packages/plugin-streams-core/mod.ts';
import { createStreamTopicFixture } from '../../../packages/plugin-streams-core/src/testing/mod.ts';
import { createNetScriptChatStreamProxy } from '../../../packages/fresh/src/runtime/ai/mod.ts';
import { createNetScriptStreamEventSourceV1 } from '../../../packages/fresh/src/runtime/streams/mod.ts';
import { createContractAuthorizer } from '../../../packages/service/src/auth/mod.ts';

async function readSseBlocks(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  count: number,
): Promise<string[]> {
  const decoder = new TextDecoder();
  const blocks: string[] = [];
  let buffer = '';
  while (blocks.length < count) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let split = buffer.indexOf('\n\n');
    while (split !== -1 && blocks.length < count) {
      blocks.push(buffer.slice(0, split));
      buffer = buffer.slice(split + 2);
      split = buffer.indexOf('\n\n');
    }
  }
  return blocks;
}

function parseControlBlock(block: string): Record<string, unknown> {
  const dataLines = block
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).trimStart());
  return JSON.parse(dataLines.join('\n')) as Record<string, unknown>;
}

const port = getAvailablePort({ preferredPort: 0 });
const server = new DurableStreamTestServer({ port });
const serverOrigin = await server.start();

try {
  // 1. Chat stream proxy baseline: no auth hook + forwards client Cookie upstream.
  let forwardedCookie: string | null = null;
  const chatProxy = createNetScriptChatStreamProxy({
    target: { sessionId: 'synthetic-session', baseUrl: serverOrigin },
    auth: () => ({ Authorization: 'Bearer synthetic-server-secret' }),
    fetch: (input) => {
      const req = input as Request;
      forwardedCookie = req.headers.get('cookie');
      return Promise.resolve(new Response('[]', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }));
    },
  });
  const chatResponse = await chatProxy(
    new Request(`${serverOrigin}/api/chat/synthetic-session`, {
      method: 'GET',
      headers: { cookie: '__Host-ns_session=synthetic-cookie' },
    }),
  );
  await chatResponse.body?.cancel();
  console.log(
    `CHAT_GET_STATUS_WITHOUT_AUTH_HOOK ${chatResponse.status} FORWARDED_SYNTHETIC_COOKIE ${
      forwardedCookie === '__Host-ns_session=synthetic-cookie'
    }`,
  );

  // 2. Contract authorizer rejects parameterized paths in rawRoutes.
  let rawRouteError = 'NONE';
  try {
    createContractAuthorizer({}, {
      rawRoutes: [{ path: '/api/streams/{feedId}', authentication: 'required' }],
    });
  } catch (error) {
    rawRouteError = error instanceof Error ? error.message : String(error);
  }
  console.log(`PARAMETERIZED_RAW_ROUTE ${rawRouteError}`);

  // 3. Fresh EventSource helper unconditionally prepends /v1/stream/netscript.
  const binding = createNetScriptStreamEventSourceV1({
    baseUrl: `${serverOrigin}/api/streams`,
    streamPath: '/orders/live',
    offset: '-1',
    onEvent() {},
    createEventSource: () => ({
      addEventListener() {},
      removeEventListener() {},
      close() {},
    }),
  });
  const resolved = new URL(binding.url);
  binding.dispose();
  console.log(`EVENT_SOURCE_PATH_AND_QUERY ${resolved.pathname}${resolved.search}`);

  // 4. Live DurableStreamTestServer SSE framing, ACAO header, missing stream 404, and offset resume.
  const missingUrl = new URL(buildStreamUrl('/probe/missing', serverOrigin));
  missingUrl.searchParams.set('offset', '-1');
  missingUrl.searchParams.set('live', 'sse');
  const missingResp = await fetch(missingUrl, { headers: { connection: 'close' } });
  await missingResp.body?.cancel();
  console.log(`MISSING_SSE_STATUS ${missingResp.status}`);

  const previousStreamsUrl = Deno.env.get('DURABLE_STREAMS_URL');
  Deno.env.set('DURABLE_STREAMS_URL', serverOrigin);
  const streamPath = '/probe/executions';
  const producer = createDurableStream({
    streamPath,
    schema: createStreamTopicFixture(),
    producerId: 'baseline-probe',
  });
  try {
    await producer.waitUntilReady();
    producer.upsert('execution', { id: 'exec-1', status: 'created' });
    await producer.flush();

    const sseUrl = new URL(buildStreamUrl(streamPath, serverOrigin));
    sseUrl.searchParams.set('offset', '-1');
    sseUrl.searchParams.set('live', 'sse');
    const liveAbort = new AbortController();
    const sseResp = await fetch(sseUrl, {
      headers: { connection: 'close' },
      signal: liveAbort.signal,
    });
    const contentType = (sseResp.headers.get('content-type') ?? '').split(';')[0]?.trim();
    const acao = sseResp.headers.get('access-control-allow-origin') ?? '';
    console.log(`SSE_STATUS ${sseResp.status} TYPE ${contentType} ACAO ${acao}`);

    const liveReader = sseResp.body!.getReader();
    const firstTwo = await readSseBlocks(liveReader, 2);
    const frameNames = firstTwo.map((block) => block.split(/\r?\n/)[0]?.trim() ?? '');
    const hasSseId = firstTwo.some((block) => /^id:/m.test(block));
    const ctrl1 = parseControlBlock(firstTwo[1]!);
    const ctrl1Keys = Object.keys(ctrl1).sort().join(',');
    console.log(`FRAMES ${frameNames.join(', ')} HAS_SSE_ID ${hasSseId}`);
    console.log(`CONTROL_FIELDS ${ctrl1Keys}`);

    producer.upsert('execution', { id: 'exec-2', status: 'completed' });
    await producer.flush();
    const nextTwo = await readSseBlocks(liveReader, 2);
    const ctrl2 = parseControlBlock(nextTwo[1]!);
    liveAbort.abort();
    await liveReader.cancel().catch(() => {});
    liveReader.releaseLock();

    const offset1 = String(ctrl1.streamNextOffset ?? '');
    const offset2 = String(ctrl2.streamNextOffset ?? '');
    const offsetAdvanced = offset1.length > 0 && offset2.length > 0 && offset1 !== offset2;

    const resumeUrl = new URL(buildStreamUrl(streamPath, serverOrigin));
    resumeUrl.searchParams.set('offset', offset1);
    resumeUrl.searchParams.set('live', 'sse');
    const resumeAbort = new AbortController();
    const resumeResp = await fetch(resumeUrl, {
      headers: { connection: 'close' },
      signal: resumeAbort.signal,
    });
    const resumeReader = resumeResp.body!.getReader();
    const resumedTwo = await readSseBlocks(resumeReader, 2);
    const resumedCtrl = parseControlBlock(resumedTwo[1]!);
    resumeAbort.abort();
    await resumeReader.cancel().catch(() => {});
    resumeReader.releaseLock();

    const resumedData = resumedTwo[0] ?? '';
    console.log(
      `OFFSET_ADVANCED ${offsetAdvanced} RESUME_CONTAINS_FIRST ${
        resumedData.includes('exec-1')
      } RESUME_CONTAINS_SECOND ${resumedData.includes('exec-2')} RESUME_OFFSET_MATCHES ${
        String(resumedCtrl.streamNextOffset ?? '') === offset2
      }`,
    );
  } finally {
    await producer.stop();
    if (previousStreamsUrl === undefined) {
      Deno.env.delete('DURABLE_STREAMS_URL');
    } else {
      Deno.env.set('DURABLE_STREAMS_URL', previousStreamsUrl);
    }
  }
} finally {
  await server.stop();
}
