import { assertEquals } from 'jsr:@std/assert@^1';
import { createAuthStreamDB } from '../../streams/factory.ts';

Deno.test('auth stream factory discovers Aspire URL and preserves explicit override', () => {
  withStreamsDiscovery('http://discovered.streams.test:61234', () => {
    assertEquals(
      streamUrl(createAuthStreamDB()),
      'http://discovered.streams.test:61234/v1/stream/netscript/auth/sessions',
    );
    assertEquals(
      streamUrl(createAuthStreamDB({ baseUrl: 'http://explicit.streams.test:62345/' })),
      'http://explicit.streams.test:62345/v1/stream/netscript/auth/sessions',
    );
  });
});

function streamUrl(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return undefined;
  const stream = Reflect.get(value, 'stream');
  if (typeof stream === 'object' && stream !== null) return Reflect.get(stream, 'url');

  const collections = Reflect.get(value, 'collections');
  if (typeof collections !== 'object' || collections === null) return undefined;
  const collection = Object.values(collections)[0];
  if (typeof collection !== 'object' || collection === null) return undefined;
  const id = Reflect.get(collection, 'id');
  if (typeof id !== 'string' || !id.startsWith('stream-db:')) return undefined;
  return id.slice('stream-db:'.length, id.lastIndexOf(':'));
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
