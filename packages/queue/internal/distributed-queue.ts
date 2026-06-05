/**
 * Distributed Queue Support
 *
 * Internal module that provides producer/consumer role separation for
 * distributed scaling mode. This enables horizontal scaling by running
 * scheduler (producer) and worker (consumer) on separate nodes.
 *
 * When `scaling.mode: 'distributed'` is configured:
 * - Producer nodes: Can only enqueue, cannot listen (scheduler)
 * - Consumer nodes: Can only listen, cannot enqueue (worker)
 *
 * @internal This module is NOT part of the public API.
 * @module
 */

import type {
  EnqueueOptions,
  ListenOptions,
  MessageContext,
  MessageQueue,
} from '../interfaces/message-queue.ts';

/**
 * Role for distributed queue mode.
 *
 * @internal
 */
export type DistributedRole = 'producer' | 'consumer' | 'both';

/**
 * Options for distributed queue wrapper.
 *
 * @internal
 */
export interface DistributedQueueOptions {
  /**
   * Role of this node:
   * - `producer`: Can only enqueue (scheduler node)
   * - `consumer`: Can only listen (worker node)
   * - `both`: Full queue access (combined mode, default)
   */
  role: DistributedRole;
}

/**
 * Extended MessageQueue interface with manual start capability.
 *
 * @internal
 */
export interface DistributedMessageQueue<T> extends MessageQueue<T> {
  /**
   * Manually start queue processing (for consumer role).
   * Only available when role is 'consumer'.
   */
  start?: (options?: ListenOptions) => Promise<void>;

  /**
   * The role of this queue instance.
   */
  readonly role: DistributedRole;
}

/**
 * Create a distributed queue wrapper that enforces role-based access.
 *
 * This is used internally when `scaling.mode: 'distributed'` is configured.
 * Users never import this directly - they configure via netscript.config.ts.
 *
 * @internal
 * @template T - Message payload type
 * @param queue - Base queue to wrap
 * @param options - Distributed queue options
 * @returns Queue wrapper with role enforcement
 *
 * @example
 * ```ts
 * // Internal usage in Scheduler (producer):
 * const schedulerQueue = createDistributedQueue(baseQueue, { role: 'producer' });
 * await schedulerQueue.enqueue(message);  // OK
 * await schedulerQueue.listen(handler);   // Throws!
 *
 * // Internal usage in Worker (consumer):
 * const workerQueue = createDistributedQueue(baseQueue, { role: 'consumer' });
 * await workerQueue.enqueue(message);     // Throws!
 * await workerQueue.listen(handler);      // OK
 * ```
 */
export function createDistributedQueue<T>(
  queue: MessageQueue<T>,
  options: DistributedQueueOptions,
): DistributedMessageQueue<T> {
  const { role } = options;

  // For 'both' role, return the queue as-is with role property
  if (role === 'both') {
    return {
      ...queue,
      role,
    };
  }

  // For producer role: can enqueue, cannot listen
  if (role === 'producer') {
    return {
      get nativeRetrial(): boolean {
        return queue.nativeRetrial;
      },

      role,

      async enqueue(message: T, enqueueOptions?: EnqueueOptions): Promise<void> {
        await queue.enqueue(message, enqueueOptions);
      },

      enqueueMany: queue.enqueueMany
        ? async (messages: T[], enqueueOptions?: EnqueueOptions): Promise<void> => {
          await queue.enqueueMany!(messages, enqueueOptions);
        }
        : undefined,

      listen(): Promise<void> {
        return Promise.reject(
          new Error(
            '[DistributedQueue] Producer role cannot listen for messages. ' +
              'Use role: "consumer" or role: "both" to enable message processing.',
          ),
        );
      },

      stop(): Promise<void> {
        // Producer doesn't need to stop listening
        return Promise.resolve();
      },
    };
  }

  // For consumer role: can listen, cannot enqueue
  // Also provides start() method for manual queue start
  let handler: ((message: T, context: MessageContext) => Promise<void>) | null = null;
  let listenOptions: ListenOptions | undefined;

  return {
    get nativeRetrial(): boolean {
      return queue.nativeRetrial;
    },

    role,

    enqueue(): Promise<void> {
      return Promise.reject(
        new Error(
          '[DistributedQueue] Consumer role cannot enqueue messages. ' +
            'Use role: "producer" or role: "both" to enable message enqueuing.',
        ),
      );
    },

    async listen(
      messageHandler: (message: T, context: MessageContext) => Promise<void>,
      options?: ListenOptions,
    ): Promise<void> {
      // Store handler for start() to use
      handler = messageHandler;
      listenOptions = options;
      // Actually start listening
      await queue.listen(messageHandler, options);
    },

    async stop(): Promise<void> {
      await queue.stop();
    },

    /**
     * Manually start queue processing.
     * This is useful when you want to defer starting the queue
     * until after initialization is complete.
     */
    async start(options?: ListenOptions): Promise<void> {
      if (!handler) {
        throw new Error(
          '[DistributedQueue] No handler registered. Call listen() first or pass a handler to start().',
        );
      }
      await queue.listen(handler, options ?? listenOptions);
    },
  };
}

/**
 * Check if a queue is in distributed mode.
 *
 * @internal
 * @param queue - Queue to check
 * @returns True if the queue is a distributed wrapper
 */
export function isDistributedQueue<T>(
  queue: MessageQueue<T>,
): queue is DistributedMessageQueue<T> {
  return 'role' in queue;
}

/**
 * Get the role of a distributed queue.
 *
 * @internal
 * @param queue - Queue to check
 * @returns Role or 'both' if not a distributed queue
 */
export function getQueueRole<T>(queue: MessageQueue<T>): DistributedRole {
  if (isDistributedQueue(queue)) {
    return queue.role;
  }
  return 'both';
}
