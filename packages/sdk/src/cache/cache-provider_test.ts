import { assert, assertEquals, assertInstanceOf, assertRejects } from 'jsr:@std/assert@^1';
import { getCacheProvider, resetCacheProvider } from './cache-provider.ts';

Deno.test('uninitialized cache provider error matches the documented module diagnostic', async () => {
  resetCacheProvider();
  try {
    const error = await assertRejects(() => Promise.resolve().then(getCacheProvider));
    assertInstanceOf(error, Error);

    const modulePrefix = '[NetScript SDK] Cache provider not initialized in module ';
    const moduleSuffix = ". Add `import '@netscript/sdk/cache';`";
    assert(error.message.startsWith(modulePrefix));
    const suffixIndex = error.message.indexOf(moduleSuffix, modulePrefix.length);
    assert(suffixIndex > modulePrefix.length);

    const resolvedModuleUrl = error.message.slice(modulePrefix.length, suffixIndex);
    assertEquals(resolvedModuleUrl, new URL('./cache-provider.ts', import.meta.url).href);

    const normalizedMessage = modulePrefix + '<resolved import.meta.url>' +
      error.message.slice(suffixIndex);
    const docs = await Deno.readTextFile(
      new URL('../../../../docs/site/web-layer/query-bridge.md', import.meta.url),
    );
    const documentedDiagnostic = docs.match(
      /The angle-bracket token `<resolved import\.meta\.url>` stands for the install-specific resolved module URL\.\n\n```text\n([^\n]+)\n```/,
    );
    assert(documentedDiagnostic !== null);
    assertEquals(documentedDiagnostic[1], normalizedMessage);
  } finally {
    resetCacheProvider();
  }
});
