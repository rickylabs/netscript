import { assertEquals } from '@std/assert';
import { createNetScriptChatConnection } from './create-chat-connection.ts';
import { readSseConnection } from '../../../../sdk/src/client/stream-source/internal/connection.ts';

for (const consumer of ['chat', 'sdk'] as const) {
  Deno.test(`${consumer} forced GC preserves server cancellation without fixture retention`, async () => {
    const gc: unknown = Reflect.get(globalThis, 'gc');
    if (typeof gc !== 'function') {
      const child = await new Deno.Command(Deno.execPath(), {
        args: [
          'test',
          '--allow-all',
          '--unstable-kv',
          '--v8-flags=--expose-gc',
          '--filter',
          `${consumer} forced GC`,
          new URL(import.meta.url).pathname,
        ],
      }).output();
      assertEquals(
        child.code,
        0,
        new TextDecoder().decode(child.stdout) +
          new TextDecoder().decode(child.stderr),
      );
      return;
    }
    const cancelled = Promise.withResolvers<void>();
    const received = Promise.withResolvers<void>();
    let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;
    let ended = false;
    const server = Deno.serve({ port: 0, onListen() {} }, (request) => {
      if (consumer === 'chat' && !new URL(request.url).searchParams.has('live')) {
        return new Response('[]', {
          headers: {
            'content-type': 'application/json',
            'Stream-Next-Offset': '0',
            'Stream-Up-To-Date': 'true',
          },
        });
      }
      return new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            streamController = controller;
            controller.enqueue(new TextEncoder().encode(
              'event: data\ndata: [{"type":"TEXT_MESSAGE_CONTENT","messageId":"gc","delta":"ready"}]\n\n' +
                'event: control\ndata: {"streamNextOffset":"1","upToDate":true}\n\n',
            ));
          },
          cancel() {
            ended = true;
            cancelled.resolve();
          },
        }),
        { headers: { 'content-type': 'text/event-stream' } },
      );
    });
    const url = `http://127.0.0.1:${server.addr.port}`;
    const connection = createNetScriptChatConnection({
      target: { sessionId: 'gc', baseUrl: url },
      initialOffset: '0',
    });
    const abort = new AbortController();
    const reading = consumer === 'chat'
      ? (async () => {
        for await (const _chunk of connection.subscribe()) received.resolve();
      })()
      : (async () => {
        // No fixture Response reference survives outside the SDK reader.
        await readSseConnection({
          response: await fetch(url, { signal: abort.signal }),
          signal: abort.signal,
          bufferLimit: 4096,
          lastEventId: '',
          onBytes() {},
          onRetry() {},
          onBlock: () => received.resolve(),
        });
      })();
    let deadline: ReturnType<typeof setTimeout> | undefined;
    try {
      await received.promise;
      // Leave the fetch stack and WeakRef keep-alive turn before collecting.
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      gc();
      connection.dispose();
      abort.abort();
      await Promise.race([
        cancelled.promise,
        new Promise<never>((_resolve, reject) => {
          deadline = setTimeout(
            () => reject(new Error('Server SSE cancellation missing after GC')),
            15_000,
          );
        }),
      ]);
      await reading;
    } finally {
      clearTimeout(deadline);
      connection.dispose();
      abort.abort();
      if (!ended) streamController?.close();
      await reading.catch(() => {});
      await server.shutdown();
    }
  });
}
