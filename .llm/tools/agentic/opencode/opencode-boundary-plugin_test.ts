import { assertEquals, assertStrictEquals, assertThrows } from '@std/assert';
import openCodeBoundaryPlugin, { type OpenCodeStoredMessage } from './opencode-boundary-plugin.ts';
import * as boundaryModule from './opencode-boundary-plugin.ts';

const {
  classifyDiscoverySource,
  normalizeOpenCodeHistory,
  OpenCodeHistoryNormalizationError,
  safeLocalEventId,
  historyValidationReceipt,
} = openCodeBoundaryPlugin.testing;

function assistant(id: string, parts: OpenCodeStoredMessage['parts'], extra = {}) {
  return { info: { id, role: 'assistant', ...extra }, parts } as OpenCodeStoredMessage;
}

Deno.test('plugin module exposes only the callable default at runtime', () => {
  assertEquals(Object.keys(boundaryModule), ['default']);
});

Deno.test('resume matrix removes empty deltas and structurally empty assistant events', () => {
  const messages = [
    { info: { id: 'u1', role: 'user' }, parts: [{ type: 'text', text: 'private' }] },
    assistant('empty-delta', [{ type: 'step-start' }, { type: 'text', text: '  ' }]),
    assistant('interrupted', [{ type: 'text', text: 'partial' }], { error: { name: 'Abort' } }),
  ] as OpenCodeStoredMessage[];
  const receipts = normalizeOpenCodeHistory(messages);
  assertEquals(messages.map((message) => message.info.id), ['u1', 'interrupted']);
  assertEquals(receipts, [
    {
      kind: 'history_normalization',
      eventId: 'empty-delta',
      reason: 'empty_fragment',
      removedFragments: 1,
      removedEvents: 0,
    },
    {
      kind: 'history_normalization',
      eventId: 'empty-delta',
      reason: 'empty_assistant',
      removedFragments: 0,
      removedEvents: 1,
    },
  ]);
});

Deno.test('tool-only turns preserve tool identity, result semantics, and ordering', () => {
  const tool = { type: 'tool', tool: 'search_docs', state: { status: 'completed', output: 'x' } };
  const messages = [assistant('tool-only', [
    { type: 'text', text: '' },
    tool,
    { type: 'reasoning', text: '' },
  ])];
  normalizeOpenCodeHistory(messages);
  assertEquals(messages[0].parts, [tool]);
  assertStrictEquals(messages[0].parts[0], tool);
});

Deno.test('reasoning-only and interrupted text turns remain provider-visible', () => {
  const messages = [
    assistant('reasoning', [{ type: 'reasoning', text: 'working' }]),
    assistant('interrupted', [{ type: 'text', text: 'partial' }], { error: { name: 'Abort' } }),
  ];
  assertEquals(normalizeOpenCodeHistory(messages), []);
  assertEquals(messages.length, 2);
});

Deno.test('provider switches retain stored identity and repeated normalization is idempotent', () => {
  const messages = [assistant(
    'switch',
    [{ type: 'text', text: '' }, { type: 'text', text: 'answer' }],
    { providerID: 'prior', modelID: 'prior-model' },
  )];
  assertEquals(normalizeOpenCodeHistory(messages).length, 1);
  assertEquals(normalizeOpenCodeHistory(messages), []);
  assertEquals(messages[0].info.providerID, 'prior');
  assertEquals(messages[0].info.modelID, 'prior-model');
  assertEquals(messages[0].parts, [{ type: 'text', text: 'answer' }]);
});

Deno.test('signed reasoning adjacency fails closed with safe local identity only', () => {
  const messages = [assistant('evt-safe_42', [
    { type: 'reasoning', text: 'hidden', metadata: { anthropic: { signature: 'secret' } } },
    { type: 'text', text: '' },
  ])];
  const error = assertThrows(
    () => normalizeOpenCodeHistory(messages),
    OpenCodeHistoryNormalizationError,
    'event=evt-safe_42',
  );
  assertEquals(error.message.includes('hidden'), false);
  assertEquals(error.message.includes('secret'), false);
  assertEquals(messages[0].parts.length, 2);
});

Deno.test('unsafe event identity is bounded and never echoed', () => {
  assertEquals(safeLocalEventId('ok:12'), 'ok:12');
  assertEquals(safeLocalEventId('private value with spaces'), 'unknown');
  assertEquals(safeLocalEventId('x'.repeat(97)), 'unknown');
});

Deno.test('discovery telemetry distinguishes MCP, web, local docs, and generated source', () => {
  assertEquals(classifyDiscoverySource('netscript_search_docs', { query: 'private' }), 'mcp');
  assertEquals(classifyDiscoverySource('webfetch', { url: 'https://private.test' }), 'public_web');
  assertEquals(
    classifyDiscoverySource('read', { path: '/project/.netscript/docs/help.md' }),
    'local_docs',
  );
  assertEquals(
    classifyDiscoverySource('grep', { path: '/project/generated/client.ts' }),
    'generated_source',
  );
  assertEquals(classifyDiscoverySource('write', { path: '/project/file.ts' }), undefined);
});

Deno.test('history validation receipt proves every dispatch without retaining content', () => {
  const messages = [assistant('resume-event', [{ type: 'text', text: 'private answer' }])];
  assertEquals(historyValidationReceipt(messages, []), {
    kind: 'history_validation',
    eventId: 'resume-event',
    reason: 'provider_valid',
    assistantEventCount: 1,
    removedFragments: 0,
    removedEvents: 0,
  });
  const transformations = normalizeOpenCodeHistory([
    assistant('empty-event', [{ type: 'text', text: '' }]),
  ]);
  assertEquals(historyValidationReceipt([], transformations), {
    kind: 'history_validation',
    eventId: 'empty-event',
    reason: 'normalized',
    assistantEventCount: 0,
    removedFragments: 1,
    removedEvents: 1,
  });
});
