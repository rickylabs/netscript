/** The reduced rendering projection shared by seed and live chat. @module */
import type {
  NetScriptChatMessage,
  NetScriptChatSnapshot,
  RenderPart,
} from './create-chat-connection.ts';

// The ONE projection reducer (seed + live share this — see mod.ts @module doc).

/**
 * The single chat projection reducer. Both the seed snapshot
 * ({@link resolveChatSnapshot}) and the live island projection (FB2) MUST route
 * through this function so tool cards and message text never diverge between
 * first paint and the first live chunk (the ONE-PROJECTION LAW). It reduces the
 * materialized session `messages` into NetScript-owned messages plus renderable
 * parts; it is deterministic and side-effect free.
 */
export function projectChatSnapshot(
  messages: readonly unknown[],
): Pick<NetScriptChatSnapshot, 'messages' | 'renderParts'> {
  const outMessages: NetScriptChatMessage[] = [];
  const renderParts: RenderPart[] = [];

  messages.forEach((raw, index) => {
    const record = asRecord(raw);
    const id = asString(record.id) ?? `message-${index}`;
    const role = normalizeRole(record.role);
    const parts = Array.isArray(record.parts) ? record.parts : [];

    const textSegments: string[] = [];
    parts.forEach((rawPart, partIndex) => {
      const part = asRecord(rawPart);
      const type = asString(part.type) ?? 'text';
      if (type.includes('tool')) {
        renderParts.push({
          kind: 'tool',
          id: asString(part.toolCallId) ?? `${id}:tool:${partIndex}`,
          role,
          toolName: asString(part.toolName) ?? asString(part.name) ?? 'tool',
          toolState: normalizeToolState(part.state),
          input: part.input,
          output: part.output,
        });
        return;
      }
      const text = asString(part.text) ?? asString(part.content);
      if (text) textSegments.push(text);
    });

    const content = textSegments.join('') || asString(record.content) || '';
    outMessages.push({ id, role, content });
    if (content) {
      renderParts.push({ kind: 'text', id: `${id}:text`, role, text: content });
    }
  });

  return { messages: outMessages, renderParts };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function normalizeRole(value: unknown): NetScriptChatMessage['role'] {
  return value === 'system' || value === 'user' || value === 'tool' ? value : 'assistant';
}

function normalizeToolState(value: unknown): RenderPart['toolState'] {
  return value === 'pending' || value === 'streaming' || value === 'error' ? value : 'complete';
}
