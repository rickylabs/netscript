import { assertInstanceOf, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1';
import { getCacheProvider, resetCacheProvider } from './cache-provider.ts';

Deno.test('uninitialized cache provider error names the registration import', async () => {
  resetCacheProvider();
  const error = await assertRejects(() => Promise.resolve().then(getCacheProvider));
  assertInstanceOf(error, Error);
  assertStringIncludes(error.message, '@netscript/sdk/cache');
});
