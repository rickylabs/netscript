import { assertEquals } from '@std/assert';
import { runDocumentedStreamExample } from './run-documented-stream-example.ts';

Deno.test('unchanged documented native EventSource example consumes named SSE', async () => {
  const server = Deno.serve({ port: 0, onListen() {} }, () => {
    const body = [
      'event: data',
      `data: ${
        JSON.stringify([
          change('deleted-example', 'upsert'),
          change('retained-example', 'upsert'),
          change('deleted-example', 'delete'),
        ])
      }`,
      '',
      'event: control',
      `data: ${JSON.stringify({ streamNextOffset: 'opaque:docs/1', upToDate: true })}`,
      '',
      '',
    ].join('\n');
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(body));
      },
    });
    return new Response(stream, {
      headers: { 'content-type': 'text/event-stream' },
    });
  });

  try {
    assertEquals(await runDocumentedStreamExample(`http://127.0.0.1:${server.addr.port}`), 1);
  } finally {
    await server.shutdown();
  }
});

function change(key: string, operation: 'upsert' | 'delete'): Record<string, unknown> {
  return {
    type: 'execution',
    key,
    ...(operation === 'delete' ? {} : { value: { status: 'running' } }),
    headers: {
      operation,
      correlationId: 'docs-runtime-proof',
      traceparent: '00-00000000000000000000000000000001-0000000000000001-01',
    },
  };
}
