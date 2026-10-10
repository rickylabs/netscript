/** Native message append policy over the existing TanStack chunk protocol. @module */
import type { StreamChunk, UIMessage } from '@tanstack/ai';
import { StreamProcessor } from '@tanstack/ai/client';
import { toMessageEchoChunks } from '@durable-streams/tanstack-ai-transport';

const MESSAGE_APPEND = 'netscript.chat.messages';

/** Encode complete new messages once, alongside compatible upstream text echoes. */
export function chatMessageChunks(messages: readonly unknown[]): readonly unknown[] {
  if (messages.length === 0) return [];
  // The native event follows the echoes so replay restores original parts.
  const chunks: unknown[] = messages.flatMap((message) =>
    toMessageEchoChunks(message as Parameters<typeof toMessageEchoChunks>[0])
  );
  chunks.push({ type: 'CUSTOM', name: MESSAGE_APPEND, value: messages });
  return chunks;
}

/** Replay native appends and ordinary chunks through one upstream reducer. */
export function createChatMessageReplay(): {
  readonly apply: (chunk: unknown) => unknown;
  readonly messages: () => readonly unknown[];
} {
  const processor = new StreamProcessor();
  return {
    messages: () => processor.getMessages(),
    apply(chunk) {
      if (chunk === null || typeof chunk !== 'object') return chunk;
      const record = chunk as Record<string, unknown>;
      if (record.type === 'CUSTOM' && record.name === MESSAGE_APPEND) {
        if (!Array.isArray(record.value)) throw new Error('Invalid durable chat message append.');
        const messages = new Map(processor.getMessages().map((message) => [message.id, message]));
        for (const message of record.value as UIMessage[]) messages.set(message.id, message);
        processor.setMessages([...messages.values()]);
        // Consumers speak the standard snapshot protocol, not the storage extension.
        return { type: 'MESSAGES_SNAPSHOT', messages: processor.getMessages() };
      }
      processor.processChunk(chunk as StreamChunk);
      return chunk;
    },
  };
}
