/**
 * History-truncation strategy for the agent loop.
 *
 * Each iteration the loop asks a {@linkcode HistoryStrategy} to reduce the full
 * working transcript to the messages actually sent to the model, so per-call
 * context stays bounded as a conversation grows. The strategy is a pluggable
 * seam; the default is a sliding window.
 *
 * @module
 */

import type { Message } from '../contracts/message.ts';

/**
 * Reduces the working transcript to the messages sent to the model this turn.
 * Implementations must be pure (no mutation of the input) and order-preserving.
 */
export interface HistoryStrategy {
  /** Return the (possibly truncated) messages to send this turn. */
  apply(messages: readonly Message[]): readonly Message[];
}

/** Options for {@linkcode slidingWindowHistory}. */
export interface SlidingWindowOptions {
  /**
   * Maximum number of non-system messages to keep (the most recent ones).
   * Defaults to {@linkcode DEFAULT_HISTORY_WINDOW}.
   */
  readonly maxMessages?: number;
  /**
   * Whether to always retain leading `system`-role messages regardless of the
   * window. Defaults to `true` so the system framing is never truncated away.
   */
  readonly preserveSystem?: boolean;
}

/** Default sliding-window size (non-system messages retained). */
export const DEFAULT_HISTORY_WINDOW = 20;

/**
 * A sliding-window {@linkcode HistoryStrategy}: keep every leading `system`
 * message (when `preserveSystem`), then the most recent `maxMessages`
 * non-system messages, preserving order.
 *
 * @example
 * ```ts
 * const strategy = slidingWindowHistory({ maxMessages: 8 });
 * const windowed = strategy.apply(fullTranscript);
 * ```
 */
export function slidingWindowHistory(options: SlidingWindowOptions = {}): HistoryStrategy {
  const maxMessages = options.maxMessages ?? DEFAULT_HISTORY_WINDOW;
  const preserveSystem = options.preserveSystem ?? true;
  return {
    apply(messages: readonly Message[]): readonly Message[] {
      if (messages.length <= maxMessages) {
        return messages;
      }
      const leadingSystem: Message[] = [];
      if (preserveSystem) {
        for (const message of messages) {
          if (message.role !== 'system') {
            break;
          }
          leadingSystem.push(message);
        }
      }
      const rest = messages.slice(leadingSystem.length);
      const recent = rest.slice(Math.max(0, rest.length - maxMessages));
      return [...leadingSystem, ...recent];
    },
  };
}
