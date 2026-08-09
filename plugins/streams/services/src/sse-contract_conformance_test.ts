/**
 * Real-server conformance for the exported NetScript SSE contract.
 *
 * @module
 */

import { DurableStreamTestServer } from '@durable-streams/server';
import { getAvailablePort } from '@std/net';
import { createPluginService } from '@netscript/plugin/service';
import { buildStreamUrl, createDurableStream } from '@netscript/plugin-streams-core';
import {
  createStreamSseReplayStateV1,
  parseStreamSseEventV1,
  reduceStreamSseReplayStateV1,
  STREAM_SSE_CONTRACT_V1,
  type StreamSseConsumerEventV1,
} from '@netscript/plugin-streams-core/sse';
import { createStreamTopicFixture } from '@netscript/plugin-streams-core/testing';
import { assertEquals } from '@std/assert';
import { createStreamsProxyHandler } from './proxy.ts';

interface SseTextFrame {
  readonly eventName: string;
  readonly data: string;
}

function parseTextFrame(text: string): SseTextFrame | null {
  let eventName = '';
  const data: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('event:')) eventName = line.slice('event:'.length).trim();
    if (line.startsWith('data:')) data.push(line.slice('data:'.length).trimStart());
  }
  return eventName && data.length > 0 ? { eventName, data: data.join('\n') } : null;
}

async function readThroughCommittedControl(response: Response): Promise<SseTextFrame[]> {
  if (!response.body) throw new Error('Expected streaming SSE response body');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const frames: SseTextFrame[] = [];
  let buffered = '';

  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffered += decoder.decode(chunk.value, { stream: true });
      const parts = buffered.split(/\r?\n\r?\n/);
      buffered = parts.pop() ?? '';
      for (const part of parts) {
        const frame = parseTextFrame(part);
        if (!frame) continue;
        frames.push(frame);
        if (frame.eventName === STREAM_SSE_CONTRACT_V1.wireEventNames[1]) return frames;
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return frames;
}

Deno.test({
  name: 'real streams service proxy conforms to the exported v1 SSE authority',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const previousUrl = Deno.env.get('DURABLE_STREAMS_URL');
    const internalPort = await getAvailablePort();
    const upstream = new DurableStreamTestServer({ port: internalPort, host: '127.0.0.1' });
    await upstream.start();
    const frontPort = await getAvailablePort();
    const front = await createPluginService({}, {
      name: 'streams-sse-contract',
      version: '0.0.0-test',
      port: frontPort,
      serveRpc: false,
      rawRoutes: [{
        method: 'all',
        path: '/*',
        handler: createStreamsProxyHandler({
          internalPort,
          liveCreateWait: { waitMs: 250, pollMs: 10 },
        }),
      }],
    }).serve();
    const baseUrl = `http://127.0.0.1:${front.addr.port}`;
    Deno.env.set('DURABLE_STREAMS_URL', baseUrl);
    const streamPath = `/contract/${crypto.randomUUID()}`;
    const producer = createDurableStream({
      streamPath,
      schema: createStreamTopicFixture(),
      producerId: 'sse-contract-test',
    });

    try {
      producer.upsert(
        'execution',
        { id: 'one', status: 'created' },
        { correlationId: 'request-explicit', messageId: 'message-one' },
      );
      producer.upsert('execution', { id: 'two', status: 'created' });
      producer.delete('execution', 'two');
      await producer.flush();

      const response = await fetch(
        `${buildStreamUrl(streamPath, baseUrl)}?offset=-1&live=sse`,
        { signal: AbortSignal.timeout(5_000) },
      );
      assertEquals(response.status, 200);
      assertEquals(response.headers.get('content-type')?.includes('text/event-stream'), true);

      const textFrames = await readThroughCommittedControl(response);
      let state = createStreamSseReplayStateV1();
      const outcomes: StreamSseConsumerEventV1[] = [];
      for (const textFrame of textFrames) {
        assertEquals(
          STREAM_SSE_CONTRACT_V1.wireEventNames.some((name) => name === textFrame.eventName),
          true,
        );
        const parsed = parseStreamSseEventV1(textFrame);
        if (!parsed.ok) throw new Error(parsed.error.message);
        const reduction = reduceStreamSseReplayStateV1(state, parsed.frame);
        state = reduction.state;
        outcomes.push(reduction.event);
      }

      const changes = outcomes.flatMap((outcome) =>
        outcome.event === 'data' ? [...outcome.payload] : []
      );
      assertEquals(changes.map((change) => change.headers.operation), [
        'upsert',
        'upsert',
        'delete',
      ]);
      assertEquals(changes.map((change) => change.headers.correlationId), [
        'request-explicit',
        'two',
        'two',
      ]);
      assertEquals(changes.every((change) => change.headers.traceparent.length === 55), true);
      assertEquals(Object.hasOwn(changes[2] ?? {}, 'value'), false);
      assertEquals(state.pendingBatches, []);
      assertEquals(typeof state.lastCommittedOffset, 'string');
    } finally {
      await producer.close();
      await front.stop();
      await upstream.stop();
      if (previousUrl === undefined) Deno.env.delete('DURABLE_STREAMS_URL');
      else Deno.env.set('DURABLE_STREAMS_URL', previousUrl);
    }
  },
});
