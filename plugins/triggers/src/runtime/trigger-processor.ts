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
    fileWatcher = options.fileWatcher ?? new WatchersFileWatcherAdapter();
    const activeProcessor = processor;
    for (const definition of definitions) {
      if (isScheduledTriggerDefinition(definition)) {
        await scheduler.schedule(definition.id, definition, async (event) => {
          await activeProcessor.process(event, definition);
        });
      } else if (isFileWatchDefinition(definition)) {
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
    await Promise.all([
      scheduler?.stop({ drainTimeoutMs: options.drainTimeoutMs }),
      fileWatcher?.stop(),
      processor?.stop({ drainTimeoutMs: options.drainTimeoutMs }),
    ]);
    if (options.signal?.aborted) options.health?.stopped();
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
