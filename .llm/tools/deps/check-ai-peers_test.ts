import { assertEquals, assertThrows } from '@std/assert';
import {
  findAiPeerConflicts,
  loadRegistryVersions,
  parsePublishedVersion,
  resolvedNpmSpecifiers,
} from './check-ai-peers.ts';

Deno.test('AI peers reject incompatible admitted adapter patches and consumer cores', () => {
  const compatible = {
    name: '@tanstack/ai-anthropic',
    version: '0.18.3',
    corePeer: '^0.52.0',
  };
  const incompatible = {
    name: '@tanstack/ai-anthropic',
    version: '0.18.5',
    corePeer: '^0.53.0',
  };
  assertEquals(findAiPeerConflicts(['0.52.3'], [compatible]), []);
  assertEquals(findAiPeerConflicts(['0.52.3'], [compatible, incompatible]), [
    '@tanstack/ai-anthropic@0.18.5 requires AI ^0.53.0; got 0.52.3',
  ]);
  assertEquals(findAiPeerConflicts(['0.52.3', '0.53.0'], [compatible]), [
    '@tanstack/ai-anthropic@0.18.3 requires AI ^0.52.0; got 0.53.0',
  ]);
  assertEquals(findAiPeerConflicts(['0.53.1'], [incompatible]), []);
  assertEquals(
    findAiPeerConflicts(['0.52.3'], [{
      name: '@tanstack/ai-mcp',
      version: '0.3.8',
    }]),
    [],
  );
  assertThrows(
    () => findAiPeerConflicts([], [compatible]),
    Error,
    'No admitted AI core',
  );
  assertThrows(
    () => findAiPeerConflicts(['0.52.3'], [{ ...compatible, corePeer: 'invalid' }]),
    TypeError,
  );
});

Deno.test('cold graph inventories transitive and external AI peer holders without prefix filtering', () => {
  assertEquals(
    resolvedNpmSpecifiers([
      '@tanstack/ai@0.65.0',
      '@tanstack/ai-openai@0.27.0_@tanstack+ai@0.65.0',
      '@tanstack/openai-base@0.12.4_@tanstack+ai@0.65.0',
      'external_provider@1.2.3_@tanstack+ai@0.65.0',
      '@tanstack/openai-base@0.12.4_@tanstack+ai@0.65.1',
    ]),
    [
      '@tanstack/ai@0.65.0',
      '@tanstack/ai-openai@0.27.0',
      '@tanstack/openai-base@0.12.4',
      'external_provider@1.2.3',
    ],
  );
  assertEquals(
    findAiPeerConflicts(['0.52.3'], [
      {
        name: '@tanstack/openai-base',
        version: '0.10.16',
        corePeer: '^0.59.0',
      },
    ]),
    ['@tanstack/openai-base@0.10.16 requires AI ^0.59.0; got 0.52.3'],
  );
});

Deno.test('published peer probe accepts both exact version forms and rejects unsafe fallback', () => {
  assertEquals(parsePublishedVersion([]), undefined);
  assertEquals(
    parsePublishedVersion(['--published-version', '0.0.7']),
    '0.0.7',
  );
  assertEquals(parsePublishedVersion(['--published-version=0.0.7']), '0.0.7');
  for (
    const args of [
      ['--published-version'],
      ['--published-version='],
      ['--published-version', '^0.0.7'],
      ['--published-version', 'invalid'],
      ['--published-verison=0.0.7'],
      ['unexpected'],
      ['--published-version', '0.0.7', '--published-version=0.0.8'],
    ]
  ) assertThrows(() => parsePublishedVersion(args));
});

Deno.test('mixed admitted releases retain incompatible intermediate peers after a peerless release', async () => {
  const queries: string[] = [];
  const rows = await loadRegistryVersions(
    '@tanstack/ai-mcp@^0.3.0',
    (specifier, field) => {
      queries.push(`${specifier} ${field}`);
      if (field === 'version') {
        return Promise.resolve([
          '0.3.0',
          '0.3.1',
          '0.3.2',
        ]);
      }
      if (specifier.endsWith('@0.3.0')) return Promise.resolve(undefined);
      return Promise.resolve([{
        '@tanstack/ai': specifier.endsWith('@0.3.1') ? '^0.53.0' : '^0.52.0',
      }]);
    },
  );
  assertEquals(rows[0], {
    name: '@tanstack/ai-mcp',
    version: '0.3.0',
    corePeer: undefined,
  });
  assertEquals(findAiPeerConflicts(['0.52.3'], rows), [
    '@tanstack/ai-mcp@0.3.1 requires AI ^0.53.0; got 0.52.3',
  ]);
  assertEquals(queries, [
    '@tanstack/ai-mcp@^0.3.0 version',
    '@tanstack/ai-mcp@0.3.0 peerDependencies',
    '@tanstack/ai-mcp@0.3.1 peerDependencies',
    '@tanstack/ai-mcp@0.3.2 peerDependencies',
  ]);
});
