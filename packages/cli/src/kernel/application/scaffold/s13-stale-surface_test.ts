import { assert, assertStringIncludes } from '@std/assert';

Deno.test('TypeScript AppHost wording describes the native Deno AppHost workspace member', async () => {
  const source = await Deno.readTextFile(new URL('./render-ts-apphost.ts', import.meta.url));
  assertStringIncludes(source, 'All TS AppHost files live here as a native Deno workspace member.');
});

Deno.test('unused scaffold community toolkit pin is removed', async () => {
  const source = await Deno.readTextFile(
    new URL('../../constants/scaffold/scaffold-aspire.ts', import.meta.url),
  );
  assert(!source.includes('SCAFFOLD_COMMUNITY_TOOLKIT'));
});
