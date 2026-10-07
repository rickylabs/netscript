import { assertEquals, assertThrows } from '@std/assert';
import { findAiPeerConflicts, resolvedNpmSpecifiers } from './check-ai-peers.ts';

Deno.test('AI peers reject incompatible admitted adapter patches and consumer cores', () => {
  const compatible = { name: '@tanstack/ai-anthropic', version: '0.18.3', corePeer: '^0.52.0' };
  const incompatible = { name: '@tanstack/ai-anthropic', version: '0.18.5', corePeer: '^0.53.0' };
  assertEquals(findAiPeerConflicts(['0.52.3'], [compatible]), []);
  assertEquals(findAiPeerConflicts(['0.52.3'], [compatible, incompatible]), [
    '@tanstack/ai-anthropic@0.18.5 requires AI ^0.53.0; got 0.52.3',
  ]);
  assertEquals(findAiPeerConflicts(['0.52.3', '0.53.0'], [compatible]), [
    '@tanstack/ai-anthropic@0.18.3 requires AI ^0.52.0; got 0.53.0',
  ]);
  assertEquals(findAiPeerConflicts(['0.53.1'], [incompatible]), []);
  assertEquals(
    findAiPeerConflicts(['0.52.3'], [{ name: '@tanstack/ai-mcp', version: '0.3.8' }]),
    [],
  );
  assertThrows(() => findAiPeerConflicts([], [compatible]), Error, 'No admitted AI core');
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
      { name: '@tanstack/openai-base', version: '0.10.16', corePeer: '^0.59.0' },
    ]),
    ['@tanstack/openai-base@0.10.16 requires AI ^0.59.0; got 0.52.3'],
  );
});
