import { assertEquals, assertThrows } from '@std/assert';
import { findAiPeerConflicts } from './check-ai-peers.ts';

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
