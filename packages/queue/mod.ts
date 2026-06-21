/**
 * @netscript/queue
 *
 * Provider-agnostic message queue abstraction for NetScript applications.
 * Wraps Fedify's battle-tested queue adapters with unified interface.
 *
 * Features:
 * - Multiple backends: Deno KV, Redis, RabbitMQ
 * - Type-safe messages with Zod validation
 * - Auto-discovery from Aspire environment
 * - Native retry support where available
 * - Delayed message execution
 *
 * @example
 * ```ts
 * import { createQueue, createTypedQueue } from '@netscript/queue';
 * import { z } from 'zod';
 *
 * // Simple queue (auto-discovers backend)
 * const queue = createQueue<MyMessage>('notifications');
 * await queue.enqueue({ type: 'email', to: 'user@example.com' });
 *
 * // Type-safe queue with validation
 * const MessageSchema = z.object({
 *   type: z.enum(['email', 'sms']),
 *   to: z.string(),
 *   body: z.string(),
 * });
 *
 * const typedQueue = createTypedQueue('notifications', MessageSchema);
 * await typedQueue.enqueue({
 *   type: 'email',
 *   to: 'user@example.com',
 *   body: 'Hello!',
 * });
 *
 * // Listen for messages
 * await queue.listen(async (message) => {
 *   await processMessage(message);
 * });
 * ```
 *
 * @module
 */

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export {
  createParallelQueue,
  createQueue,
  createTypedQueue,
  type ParallelQueueOptions,
  type TypedMessageQueue,
} from './factory/mod.ts';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export type {
  EnqueueOptions,
  ListenOptions,
  MessageContext,
  MessageQueue,
  NackOptions,
} from './ports/message-queue.ts';
export type {
  DeadLetterReason,
  DeadLetterRecord,
  DeadLetterStorePort,
} from './ports/dead-letter.ts';

export {
  type QueueConnectionOptions,
  type QueueOptions,
  QueueProvider,
  type TypedQueueOptions,
} from './ports/options.ts';

// ============================================================================
// ERROR TYPES
// ============================================================================

export {
  QueueConfigurationError,
  QueueConnectionError,
  QueueError,
  QueueErrorCode,
  QueueHandlerError,
  QueueValidationError,
} from './ports/errors.ts';

// ============================================================================
// UTILITIES
// ============================================================================

export {
  safeValidate,
  validateOrThrow,
  type ValidationResult,
  type ValidationSchema,
  withValidation,
} from './validation/mod.ts';
