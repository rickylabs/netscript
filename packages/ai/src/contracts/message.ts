/**
 * Conversation message contract.
 *
 * The single canonical message shape passed to model providers and threaded
 * through the agent loop. Structurally aligned with `@tanstack/ai`'s
 * `ModelMessage` so E2 adapters map without translation.
 *
 * @module
 */

import type { MessageContent } from './content.ts';
import type { ToolCall } from './tool.ts';

/**
 * Role of a message author within a conversation.
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * A single conversation message.
 *
 * - `assistant` messages may carry {@linkcode Message.toolCalls}.
 * - `tool` messages carry the result of a prior tool call and set
 *   {@linkcode Message.toolCallId} to correlate it.
 */
export interface Message {
  /** Author role. */
  readonly role: MessageRole;
  /** The message body — text or multimodal parts. */
  readonly content: MessageContent;
  /** Optional author label (e.g. a tool or participant name). */
  readonly name?: string;
  /** Correlates a `tool`-role message with the originating call. */
  readonly toolCallId?: string;
  /** Tool calls requested by an `assistant` message. */
  readonly toolCalls?: readonly ToolCall[];
}
