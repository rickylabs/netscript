import type {
  FileWatchDefinition,
  ScheduledTriggerDefinition,
  TriggerDefinition,
} from '@netscript/plugin-triggers-core/domain';
import type {
  FileWatcherPort,
  ProcessableTriggerDefinition,
  TriggerProcessorPort,
  TriggerSchedulerPort,
} from '@netscript/plugin-triggers-core/ports';
import { CronTriggerSchedulerAdapter } from './cron-trigger-scheduler-adapter.ts';
import { loadProjectTriggerDefinitions } from './project-trigger-registry.ts';
import { createRuntimeTriggerProcessor } from './trigger-runtime-processor.ts';
import { WatchersFileWatcherAdapter } from './watchers-file-watcher-adapter.ts';

export type TriggerProcessorRuntimeOptions = Readonly<{
  signal?: AbortSignal;
  definitions?: readonly ProcessableTriggerDefinition[];
  processor?: TriggerProcessorPort;
  scheduler?: TriggerSchedulerPort;
  fileWatcher?: FileWatcherPort;
  kv?: Deno.Kv;
  drainTimeoutMs?: number;
}>;

/** Background trigger processor entrypoint for Aspire-managed runtimes. */
export async function startTriggerProcessorRuntime(
  options: TriggerProcessorRuntimeOptions = {},
): Promise<void> {
  if (options.signal?.aborted) {
    return;
  }

  const definitions = options.definitions ?? await loadProjectTriggerDefinitions();
  const processor = options.processor ?? await createRuntimeTriggerProcessor({ kv: options.kv });
  const scheduler = options.scheduler ?? new CronTriggerSchedulerAdapter();
  const fileWatcher = options.fileWatcher ?? new WatchersFileWatcherAdapter();

  for (const definition of definitions) {
    if (isScheduledTriggerDefinition(definition)) {
      await scheduler.schedule(
        definition.id,
        definition,
        async (event) => {
          await processor.process(event, definition);
        },
      );
    } else if (isFileWatchDefinition(definition)) {
      await fileWatcher.watch(
        definition,
        async (event) => {
          await processor.process(event, definition);
        },
      );
    }
  }

  await waitForAbort(options.signal);
  await Promise.all([
    scheduler.stop({ drainTimeoutMs: options.drainTimeoutMs }),
    fileWatcher.stop(),
    processor.stop({ drainTimeoutMs: options.drainTimeoutMs }),
  ]);
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
