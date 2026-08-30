import { assertEquals } from 'jsr:@std/assert@^1';
import { createWorkersStreamDB } from '../../streams/factory.ts';

Deno.test('workers stream factory discovers Aspire URL and preserves explicit override', () => {
  withStreamsDiscovery('http://discovered.streams.test:61234', () => {
    assertEquals(
      streamUrl(createWorkersStreamDB()),
      'http://discovered.streams.test:61234/v1/stream/netscript/workers/executions',
    );
    assertEquals(
      streamUrl(createWorkersStreamDB({ baseUrl: 'http://explicit.streams.test:62345/' })),
      'http://explicit.streams.test:62345/v1/stream/netscript/workers/executions',
    );
  });
});

function streamUrl(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return undefined;
  const stream = Reflect.get(value, 'stream');
  return typeof stream === 'object' && stream !== null ? Reflect.get(stream, 'url') : undefined;
}

function withStreamsDiscovery(url: string, action: () => void): void {
  const explicit = Deno.env.get('DURABLE_STREAMS_URL');
  const discovered = Deno.env.get('services__streams__http__0');
  try {
    Deno.env.delete('DURABLE_STREAMS_URL');
    Deno.env.set('services__streams__http__0', url);
    action();
  } finally {
    explicit === undefined
      ? Deno.env.delete('DURABLE_STREAMS_URL')
      : Deno.env.set('DURABLE_STREAMS_URL', explicit);
    discovered === undefined
      ? Deno.env.delete('services__streams__http__0')
      : Deno.env.set('services__streams__http__0', discovered);
  }
}
