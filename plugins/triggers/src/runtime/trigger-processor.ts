import { createServiceLogger, ensureLogging } from '@netscript/logger';
import type { LoggerPort } from '@netscript/plugin-triggers-core/runtime';
import { openTriggerRuntimeKv } from '@netscript/plugin-triggers-core/stores';
import type { ChildHealthMonitor } from '@netscript/plugin/health';
import type {
  FileWatchDefinition,
  ScheduledTriggerDefinition,
} from '@netscript/plugin-triggers-core/domain';
import type {
  FileWatcherPort,
  ProcessableTriggerDefinition,
  TriggerProcessorPort,
  TriggerSchedulerPort,
} from '@netscript/plugin-triggers-core/ports';
import type { KvStore } from '@netscript/kv';
import {
  CronTriggerSchedulerAdapter,
  WatchersFileWatcherAdapter,
} from '@netscript/plugin-triggers-core/adapters';
import { loadProjectTriggerDefinitions } from './project-trigger-registry.ts';
import { createRuntimeTriggerProcessor } from './trigger-runtime-processor.ts';
import { TriggerHealthMonitor } from './trigger-health-monitor.ts';

/** Options for starting the background trigger processor runtime. */
export type TriggerProcessorRuntimeOptions = Readonly<{
  /** Optional child health monitor owned by generated runtime glue. */
  health?: ChildHealthMonitor;
  signal?: AbortSignal;
  definitions?: readonly ProcessableTriggerDefinition[];
  processor?: TriggerProcessorPort;
  scheduler?: TriggerSchedulerPort;
  fileWatcher?: FileWatcherPort;
  kv?: KvStore;
  drainTimeoutMs?: number;
  /** Structured diagnostic sink for file-watch failures and readiness transitions. */
  logger?: LoggerPort;
}>;

/** Background trigger processor entrypoint for Aspire-managed runtimes. */
export async function startTriggerProcessorRuntime(
  options: TriggerProcessorRuntimeOptions = {},
): Promise<void> {
  let processor: TriggerProcessorPort | undefined;
  let scheduler: TriggerSchedulerPort | undefined;
  let fileWatcher: FileWatcherPort | undefined;
  try {
    if (options.signal?.aborted) return;
    const definitions = options.definitions ?? await loadProjectTriggerDefinitions();
    options.health?.registryLoaded();
    const kv = options.kv ?? (!options.processor ? await openTriggerRuntimeKv() : undefined);
    if (kv) await kv.get(['netscript', 'child-health', 'triggers']);
    processor = options.processor ?? await createRuntimeTriggerProcessor({ kv, definitions });
    options.health?.dependenciesReady();
    scheduler = options.scheduler ?? new CronTriggerSchedulerAdapter();
    const logger = options.logger ?? createServiceLogger('triggers');
    fileWatcher = options.fileWatcher ?? new WatchersFileWatcherAdapter({
      onError: async (error, handle) => {
        if (options.logger === undefined) await ensureLogging();
        logger.error('trigger.file_watch.error', { triggerId: handle.id, error });
      },
      onStatusChange: async (event) => {
        if (options.health instanceof TriggerHealthMonitor) options.health.updateWatch(event);
        if (options.logger === undefined) await ensureLogging();
        logger.info('trigger.file_watch.status', event);
      },
    });
    const activeProcessor = processor;
    for (const definition of definitions) {
      if (isScheduledTriggerDefinition(definition)) {
        await scheduler.schedule(definition.id, definition, async (event) => {
          await activeProcessor.process(event, definition);
        });
      } else if (isFileWatchDefinition(definition)) {
        if (options.health instanceof TriggerHealthMonitor) {
          options.health.registerWatch(definition.id);
        }
        await fileWatcher.watch(definition, async (event) => {
          await activeProcessor.process(event, definition);
        });
      }
    }
    options.health?.running();
    await waitForAbort(options.signal);
  } catch (cause) {
    options.health?.failed();
    throw cause;
  } finally {
    await drainTriggerRuntime(scheduler, fileWatcher, processor, options.drainTimeoutMs);
    if (options.signal?.aborted) options.health?.stopped();
  }
}

/** Drain source event construction before processor admission closes, even if a source stop fails. */
async function drainTriggerRuntime(
  scheduler: TriggerSchedulerPort | undefined,
  fileWatcher: FileWatcherPort | undefined,
  processor: TriggerProcessorPort | undefined,
  drainTimeoutMs: number | undefined,
): Promise<void> {
  const sources = await Promise.allSettled([
    scheduler?.stop({ drainTimeoutMs }),
    fileWatcher?.stop(),
  ]);
  await processor?.stop({ drainTimeoutMs });
  for (const source of sources) {
    if (source.status === 'rejected') throw source.reason;
  }
}

/** Start the trigger background processor using the shared runtime-launch verb. */
export async function startCombinedProcess(
  options: TriggerProcessorRuntimeOptions = {},
): Promise<void> {
  await startTriggerProcessorRuntime(options);
}

if (import.meta.main) {
  const controller = new AbortController();
  Deno.addSignalListener('SIGINT', () => controller.abort());
  Deno.addSignalListener('SIGTERM', () => controller.abort());
  await startTriggerProcessorRuntime({ signal: controller.signal });
}

function waitForAbort(signal: AbortSignal | undefined): Promise<void> {
  if (signal?.aborted) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    signal?.addEventListener('abort', () => resolve(), { once: true });
  });
}

function isScheduledTriggerDefinition(
  definition: ProcessableTriggerDefinition,
): definition is ScheduledTriggerDefinition<string, never, never> {
  return definition.kind === 'scheduled';
}

function isFileWatchDefinition(
  definition: ProcessableTriggerDefinition,
): definition is FileWatchDefinition<string, never, never> {
  return definition.kind === 'file-watch';
}
