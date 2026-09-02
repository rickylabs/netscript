import { assert, assertStringIncludes } from '@std/assert';

Deno.test('TypeScript AppHost wording describes the supported Aspire range', async () => {
  const source = await Deno.readTextFile(new URL('./render-ts-apphost.ts', import.meta.url));
  assertStringIncludes(source, 'Aspire ≥ 13.4 validates TypeScript AppHosts before startup.');
});

Deno.test('unused scaffold community toolkit pin is removed', async () => {
  const source = await Deno.readTextFile(
    new URL('../../constants/scaffold/scaffold-aspire.ts', import.meta.url),
  );
  assert(!source.includes('SCAFFOLD_COMMUNITY_TOOLKIT'));
});
