/**
 * Queue Interfaces - Barrel Export
 *
 * Core interfaces and types for the queue package.
 *
 * @module
 */

// Core message queue interface
export type {
  EnqueueOptions,
  ListenOptions,
  MessageContext,
  MessageQueue,
} from './message-queue.ts';

// Configuration and options
export {
  type QueueConnectionOptions,
  type QueueOptions,
  QueueProvider,
  type TypedQueueOptions,
} from './options.ts';

// Error types
export {
  QueueConfigurationError,
  QueueConnectionError,
  QueueError,
  QueueErrorCode,
  QueueHandlerError,
  QueueValidationError,
} from './errors.ts';
