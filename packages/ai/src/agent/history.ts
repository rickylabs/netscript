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

/** Estimates the token cost of one conversation message. */
export type TokenEstimator = (message: Readonly<Message>) => number;

/** Options for {@linkcode tokenBudgetHistory}. */
export interface TokenBudgetHistoryOptions {
  /** Maximum estimated tokens retained across the returned messages. */
  readonly budget: number;
  /**
   * Per-message token estimator. Defaults to approximately one token per four
   * content characters.
   */
  readonly estimator?: TokenEstimator;
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

function contentCharacterCount(message: Readonly<Message>): number {
  if (typeof message.content === 'string') {
    return message.content.length;
  }
  return JSON.stringify(message.content).length;
}

function defaultTokenEstimator(message: Readonly<Message>): number {
  return Math.ceil(contentCharacterCount(message) / 4);
}

function normalizedEstimate(estimator: TokenEstimator, message: Readonly<Message>): number {
  const estimate = estimator(message);
  return Number.isFinite(estimate) && estimate > 0 ? Math.ceil(estimate) : 0;
}

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

/**
 * A token-budget {@linkcode HistoryStrategy}: preserve leading `system`
 * messages, then keep the newest contiguous message suffix that fits the
 * remaining estimated budget.
 *
 * Preserved system messages are never removed, even when their estimates alone
 * exceed the budget. Supply `estimator` to use a model-specific tokenizer.
 *
 * @example
 * ```ts
 * import { tokenBudgetHistory } from "@netscript/ai/agent";
 *
 * const strategy = tokenBudgetHistory({
 *   budget: 8_000,
 *   estimator: (message) => tokenizer.encode(String(message.content)).length,
 * });
 * const bounded = strategy.apply(fullTranscript);
 * ```
 *
 * @param options - Token budget and optional per-message estimator.
 * @returns A pure, order-preserving history strategy.
 */
export function tokenBudgetHistory(options: TokenBudgetHistoryOptions): HistoryStrategy {
  if (!Number.isFinite(options.budget) || options.budget < 0) {
    throw new RangeError('Token history budget must be a finite non-negative number');
  }

  const budget = Math.floor(options.budget);
  const estimator = options.estimator ?? defaultTokenEstimator;

  return {
    apply(messages: readonly Message[]): readonly Message[] {
      let leadingSystemCount = 0;
      let used = 0;
      while (
        leadingSystemCount < messages.length &&
        messages[leadingSystemCount]?.role === 'system'
      ) {
        used += normalizedEstimate(estimator, messages[leadingSystemCount]!);
        leadingSystemCount++;
      }

      let firstRecent = messages.length;
      for (let index = messages.length - 1; index >= leadingSystemCount; index--) {
        const estimate = normalizedEstimate(estimator, messages[index]!);
        if (used + estimate > budget) {
          break;
        }
        used += estimate;
        firstRecent = index;
      }

      return [
        ...messages.slice(0, leadingSystemCount),
        ...messages.slice(firstRecent),
      ];
    },
  };
}
