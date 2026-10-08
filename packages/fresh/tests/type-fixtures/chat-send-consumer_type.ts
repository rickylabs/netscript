import type { UIMessage } from '@tanstack/ai-preact';
import type { ModelMessage } from '@tanstack/ai';
import type { NetScriptChatConnection, NetScriptChatSendMessage } from '@netscript/fresh/ai';

// Actual types from existing declared native dependencies, used only as consumers.
export const nativeUiMessage: UIMessage = {
  id: 'rich-ui',
  role: 'user',
  name: 'author',
  createdAt: new Date('2026-10-08T00:00:00Z'),
  metadata: { application: { attachment: 'original' }, tanstack: { preserved: true } },
  parts: [
    { type: 'text', content: 'Inspect all native parts — naïve UTF-8…' },
    {
      type: 'image',
      source: { type: 'data', value: 'aW1hZ2U=', mimeType: 'image/png' },
      metadata: { detail: 'high' },
    },
    { type: 'audio', source: { type: 'data', value: 'YXVkaW8=', mimeType: 'audio/wav' } },
    { type: 'video', source: { type: 'data', value: 'dmlkZW8=', mimeType: 'video/mp4' } },
    {
      type: 'document',
      source: { type: 'data', value: 'ZG9jdW1lbnQ=', mimeType: 'application/pdf' },
      metadata: { filename: 'original.pdf' },
    },
    {
      type: 'tool-call',
      id: 'call-1',
      name: 'inspect',
      arguments: '{"file":"original"}',
      state: 'complete',
      input: { file: 'original' },
      output: { retained: true },
    },
    {
      type: 'tool-result',
      toolCallId: 'call-1',
      content: [{ type: 'text', content: 'tool result' }],
      state: 'complete',
      metadata: { retained: true },
    },
    { type: 'thinking', content: 'original reasoning' },
    {
      type: 'structured-output',
      status: 'complete',
      raw: '{"retained":true}',
      data: { retained: true },
      reasoning: 'original',
    },
  ],
};
export const nativeModelMessage: ModelMessage = {
  id: 'rich-model',
  role: 'assistant',
  name: 'model-author',
  content: [
    { type: 'text', content: 'Original model content' },
    { type: 'image', source: { type: 'data', value: 'aW1hZ2U=', mimeType: 'image/png' } },
    {
      type: 'document',
      source: { type: 'data', value: 'ZG9jdW1lbnQ=', mimeType: 'application/pdf' },
    },
  ],
  toolCalls: [{
    id: 'call-2',
    type: 'function',
    function: { name: 'inspect', arguments: '{"retained":true}' },
    metadata: { signature: 'opaque' },
  }],
  toolCallId: 'call-2',
  thinking: [{ content: 'model reasoning', signature: 'original-signature' }],
  error: 'preserved error',
  metadata: { application: { retained: true } },
  structuredOutput: {
    type: 'structured-output',
    status: 'complete',
    raw: '{"retained":true}',
    data: { retained: true },
  },
  createdAt: new Date('2026-10-08T00:00:00Z'),
};

export function consumeNativeMessages(
  connection: NetScriptChatConnection,
  ui: UIMessage,
  model: ModelMessage,
  data: unknown,
  signal: AbortSignal,
): Promise<void> {
  const messages: readonly NetScriptChatSendMessage[] = [ui, model];
  // @ts-expect-error A send input requires a valid parts or content representation.
  const missing: NetScriptChatSendMessage = { role: 'user' };
  // @ts-expect-error UI parts must be an array, not an arbitrary scalar.
  const invalid: NetScriptChatSendMessage = { id: 'bad', role: 'user', parts: 3 };
  void [missing, invalid];
  return connection.send(messages, data, signal);
}
