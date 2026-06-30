import { assertEquals } from '@std/assert';

import { defineStub, substituteTokens, type TokenValues } from './substitute.ts';

Deno.test('substituteTokens replaces declared named tokens', () => {
  const stub = defineStub({
    source: 'export const %%NAME%% = "%%VALUE%%";',
    tokens: ['NAME', 'VALUE'] as const,
  });

  assertEquals(
    substituteTokens(stub, { NAME: 'pluginName', VALUE: 'workers' }),
    'export const pluginName = "workers";',
  );
});

Deno.test('TokenValues requires every declared token at type-check time', () => {
  const stub = defineStub({
    source: 'export const %%NAME%% = "%%VALUE%%";',
    tokens: ['NAME', 'VALUE'] as const,
  });

  // @ts-expect-error Missing VALUE proves misspelled or absent tokens fail during type-check.
  const values: TokenValues<typeof stub> = { NAME: 'pluginName' };
  assertEquals(Object.keys(values), ['NAME']);
});
