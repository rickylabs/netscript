import { assertEquals, assertNotMatch, assertStringIncludes } from '@std/assert';
import { getBrowserStreamsUrlFromEnv } from '../../src/application/stream-url-resolver.ts';

const RESOLVER_URL = new URL(
  '../../src/application/stream-url-resolver.ts',
  import.meta.url,
);
const CONSTANTS_URL = new URL('../../src/domain/constants.ts', import.meta.url);

Deno.test('browser streams URL lookup prefers the full Aspire key over shorthand', () => {
  assertEquals(
    getBrowserStreamsUrlFromEnv({
      VITE_services__streams__http__0: 'http://browser-full.example',
      VITE_STREAMS_URL: 'http://browser-short.example',
    }),
    'http://browser-full.example',
  );
});

Deno.test('browser streams URL lookup falls back to the shorthand key', () => {
  assertEquals(
    getBrowserStreamsUrlFromEnv({
      VITE_STREAMS_URL: 'http://browser-short.example',
    }),
    'http://browser-short.example',
  );
});

Deno.test('browser streams URL lookup returns undefined when both keys are absent', () => {
  assertEquals(getBrowserStreamsUrlFromEnv({}), undefined);
});

Deno.test('browser streams URL reader preserves Vite-substitutable static member expressions', async () => {
  const source = await Deno.readTextFile(RESOLVER_URL);

  assertStringIncludes(
    source,
    'import.meta.env.VITE_services__streams__http__0',
  );
  assertStringIncludes(source, 'import.meta.env.VITE_STREAMS_URL');
  assertNotMatch(source, /\w+\(\s*import\.meta\s*\)/);
  assertNotMatch(source, /\benv\s*\[/);
});

Deno.test('getStreamsUrl reaches the browser reader and preserves browser key order', async () => {
  const keys = ['DURABLE_STREAMS_URL', 'services__streams__http__0'] as const;
  const previous = new Map(keys.map((key) => [key, Deno.env.get(key)]));
  const tempDir = await Deno.makeTempDir();

  try {
    for (const key of keys) Deno.env.delete(key);

    const source = (await Deno.readTextFile(RESOLVER_URL))
      .replace("'../domain/constants.ts'", JSON.stringify(CONSTANTS_URL.href))
      .replaceAll(
        'import.meta.env.VITE_services__streams__http__0',
        JSON.stringify('http://browser-full.example'),
      )
      .replaceAll(
        'import.meta.env.VITE_STREAMS_URL',
        JSON.stringify('http://browser-short.example'),
      );
    const fixtureUrl = new URL(`file://${tempDir}/stream-url-resolver.ts`);
    await Deno.writeTextFile(fixtureUrl, source);

    const fixture: { getStreamsUrl(): string } = await import(
      `${fixtureUrl.href}?test=${crypto.randomUUID()}`
    );
    assertEquals(fixture.getStreamsUrl(), 'http://browser-full.example');
  } finally {
    await Deno.remove(tempDir, { recursive: true });
    for (const key of keys) {
      const value = previous.get(key);
      if (value === undefined) Deno.env.delete(key);
      else Deno.env.set(key, value);
    }
  }
});
