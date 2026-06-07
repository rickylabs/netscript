/**
 * @netscript/cron
 *
 * Runtime-agnostic scheduling abstraction for NetScript applications.
 * Provides a consistent interface across different backends (Deno.cron, node-cron, in-memory).
 *
 * Features:
 * - Native Deno.cron support for Deno Deploy
 * - In-memory scheduler for testing
 * - Timezone support
 * - Event emission for job lifecycle
 * - Runtime auto-detection
 *
 * @example
 * ```ts
 * import { createScheduler, CronPresets } from '@netscript/cron';
 *
 * // Auto-detect runtime and create scheduler
 * const scheduler = createScheduler();
 *
 * // Schedule a job with cron expression
 * await scheduler.schedule('cleanup', '0 0 * * *', async () => {
 *   await cleanupOldRecords();
 * });
 *
 * // Schedule with preset
 * await scheduler.schedule('reports', CronPresets.WEEKDAYS_9AM, async () => {
 *   await generateDailyReport();
 * }, {
 *   timezone: 'America/New_York',
 *   runOnInit: true,
 * });
 *
 * // Listen for job events
 * scheduler.on('jobRun', (event) => {
 *   if (!event.result.success) {
 *     throw event.result.error;
 *   }
 * });
 *
 * // Trigger a job manually
 * await scheduler.trigger('cleanup');
 *
 * // List scheduled jobs
 * const jobs = scheduler.list();
 *
 * // Stop all jobs
 * await scheduler.stop();
 * ```
 *
 * @module
 */

import { DenoCronAdapter } from './adapters/deno.adapter.ts';
import { MemoryCronAdapter } from './adapters/memory.adapter.ts';
import type { CronProvider } from './ports/types.ts';
import type { CronScheduler } from './ports/scheduler.ts';

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Options for creating a scheduler
 */
export interface CreateSchedulerOptions {
  /**
   * Specific provider to use.
   * If not specified, will auto-detect based on runtime.
   */
  provider?: CronProvider;

  /**
   * Tick interval for memory adapter (in ms).
   * Only used when provider is 'memory'.
   * @default 60000
   */
  tickInterval?: number;
}

/**
 * Create a cron scheduler.
 *
 * Auto-detects the runtime and creates an appropriate scheduler:
 * - Deno runtime: Uses native Deno.cron
 * - Test environment: Uses in-memory scheduler
 *
 * @param options - Optional configuration
 * @returns A CronScheduler instance
 *
 * @example
 * ```ts
 * // Auto-detect runtime
 * const scheduler = createScheduler();
 *
 * // Force specific provider
 * const testScheduler = createScheduler({ provider: 'memory' });
 * ```
 */
export function createScheduler(options?: CreateSchedulerOptions): CronScheduler {
  const provider = options?.provider ?? detectProvider();

  switch (provider) {
    case 'deno':
      return new DenoCronAdapter();

    case 'memory': {
      const adapter = new MemoryCronAdapter();
      if (options?.tickInterval) {
        adapter.setTickInterval(options.tickInterval);
      }
      return adapter;
    }

    case 'node':
      // Node.js adapter would require node-cron package
      throw new Error(
        'Node.js cron adapter not yet implemented. Use memory adapter for testing.',
      );

    case 'temporal':
      // Temporal adapter would require @temporalio/client
      throw new Error(
        'Temporal adapter not yet implemented. Use memory adapter for testing.',
      );

    default:
      throw new Error(`Unknown cron provider: ${provider}`);
  }
}

/**
 * Detect the appropriate cron provider based on runtime
 */
function detectProvider(): CronProvider {
  // Check if we're in Deno
  if (typeof Deno !== 'undefined' && typeof Deno.cron === 'function') {
    return 'deno';
  }

  // Check if we're in a test environment
  if (
    typeof Deno !== 'undefined' &&
    (Deno.env.get('DENO_TESTING') === 'true' || Deno.args.includes('--test'))
  ) {
    return 'memory';
  }

  // Default to memory for safety
  return 'memory';
}

// ============================================================================
// SHARED INSTANCE
// ============================================================================

let defaultScheduler: CronScheduler | null = null;

/**
 * Get the default shared scheduler instance.
 *
 * Creates a new scheduler on first call, then returns the same instance.
 * Use this for simple applications that only need one scheduler.
 *
 * @param options - Optional configuration (only used on first call)
 * @returns The shared CronScheduler instance
 *
 * @example
 * ```ts
 * import { getScheduler } from '@netscript/cron';
 *
 * const scheduler = getScheduler();
 * await scheduler.schedule('my-job', '0 * * * *', handler);
 * ```
 */
export function getScheduler(options?: CreateSchedulerOptions): CronScheduler {
  if (!defaultScheduler) {
    defaultScheduler = createScheduler(options);
  }
  return defaultScheduler;
}

/**
 * Stop and reset the default scheduler.
 *
 * After calling this, getScheduler() will create a new instance.
 */
export async function stopScheduler(): Promise<void> {
  if (defaultScheduler) {
    await defaultScheduler.stop();
    defaultScheduler = null;
  }
}

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export type {
  BackoffStrategy,
  ContextualJobHandler,
  CronExpression,
  CronProvider,
  JobContext,
  JobExecutionResult,
  JobHandler,
  JobLifecycleEvent,
  JobRunEvent,
  KnownCronProvider,
  ParsedCronExpression,
  ScheduledJob,
  ScheduleOptions,
  SchedulerEventMap,
} from './ports/types.ts';

export {
  CronPresets,
  CronProviders,
  isValidCronExpression,
  parseCronExpression,
} from './ports/types.ts';

export type { CronScheduler, JobEventListener, SchedulerEvent } from './ports/scheduler.ts';

// ============================================================================
