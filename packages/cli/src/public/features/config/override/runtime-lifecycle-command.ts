import { Command } from '@cliffy/command';
import { basename } from '@std/path';

import { outputJson, outputText } from '../../../../kernel/presentation/output/default-output.ts';
import {
  RUNTIME_OVERRIDE_TOPICS,
  type RuntimeOverrideTopic,
} from '../../../../kernel/ports/runtime-config-store-port.ts';
import type { PublicCommandDependencies } from '../../root/public-command-dependencies.ts';
import { publishRuntimeOverride, rollbackRuntimeOverride } from './manage-runtime-overrides.ts';

/** Create publish/rollback runtime snapshot lifecycle commands. */
export function createRuntimeLifecycleCommands(
  dependencies: PublicCommandDependencies,
): readonly Command<any, any, any, any, any, any, any, any>[] {
  const publish = new Command()
    .name('publish')
    .description('Publish and atomically activate a versioned runtime topic file')
    .arguments('<topic:string> <file:string>')
    .option('--version <version:string>', 'Version label (defaults to source filename)')
    .action(async (options: { version?: string }, topicValue: string, file: string) => {
      const topic = requireTopic(topicValue);
      const value = JSON.parse(await dependencies.fs.readFile(file)) as unknown;
      const version = options.version ?? basename(file).replace(/^v/, '').replace(/\.json$/, '');
      const result = await publishRuntimeOverride(dependencies.runtimeConfigStore, topic, version, value);
      outputJson(result);
    });

  const rollback = new Command()
    .name('rollback')
    .description('Atomically point a runtime topic at an existing version')
    .arguments('<topic:string> <version:string>')
    .action(async (_options: unknown, topicValue: string, version: string) => {
      const result = await rollbackRuntimeOverride(
        dependencies.runtimeConfigStore,
        requireTopic(topicValue),
        version,
      );
      outputText(`Activated ${result.topic} version ${result.version}.`);
    });

  return [publish, rollback];
}

/** Validate a runtime topic argument. */
export function requireTopic(value: string): RuntimeOverrideTopic {
  if ((RUNTIME_OVERRIDE_TOPICS as readonly string[]).includes(value)) {
    return value as RuntimeOverrideTopic;
  }
  throw new Error(`Unknown runtime topic '${value}'. Expected: ${RUNTIME_OVERRIDE_TOPICS.join(', ')}`);
}
