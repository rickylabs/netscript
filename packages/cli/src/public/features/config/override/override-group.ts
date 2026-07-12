import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { Command } from '@cliffy/command';

import { outputJson, outputText } from '../../../../kernel/presentation/output/default-output.ts';
import type { RuntimeOverrideTopic } from '../../../../kernel/ports/runtime-config-store-port.ts';
import type { PublicCommandDependencies } from '../../root/public-command-dependencies.ts';
import {
  getActiveRuntimeOverride,
  setRuntimeOverrideValue,
} from './manage-runtime-overrides.ts';
import { createRuntimeLifecycleCommands } from './runtime-lifecycle-command.ts';

/** Create the dashboard-aligned runtime override command group. */
export function createOverrideCommand(
  dependencies: PublicCommandDependencies,
): CliffyCommand {
  const group = new Command().name('override').description('Manage runtime overrides')
    .action(function () {
      this.showHelp();
    });
  const [publish, rollback] = createRuntimeLifecycleCommands(dependencies);
  group.command('publish', publish).command('rollback', rollback);

  group.command('list', new Command().description('List active versions and payloads').action(async () => {
    const rows = await Promise.all((['jobs', 'sagas', 'triggers', 'features', 'tasks'] as const)
      .map(async (topic) => ({ topic, versions: await dependencies.runtimeConfigStore.versions(topic) })));
    outputJson(rows);
  }));
  group.command('get', new Command().arguments('<path:string>').action(async (_o, path: string) => {
    const { topic, id } = parseOverridePath(path);
    const payload = await getActiveRuntimeOverride(dependencies.runtimeConfigStore, topic);
    outputJson(findEntry(payload, topic, id));
  }));
  group.command('set', mutationCommand(dependencies, 'set'));
  group.command('clear', mutationCommand(dependencies, 'clear'));
  group.command('enable', mutationCommand(dependencies, 'enable'));
  group.command('disable', mutationCommand(dependencies, 'disable'));
  return group;
}

function mutationCommand(
  dependencies: PublicCommandDependencies,
  verb: string,
): CliffyCommand {
  return new Command().arguments('<path:string> [value:string]')
    .option('--rollout <percent:number>', 'Feature rollout percentage')
    .action(async (options: { rollout?: number }, path: string, value?: string) => {
      const { topic, id } = parseOverridePath(path);
      const patch = verb === 'clear' ? undefined : verb === 'enable' ? { enabled: true }
        : verb === 'disable' ? { enabled: false }
        : value ? parsePatch(value) : options.rollout !== undefined
        ? { enabled: true, rolloutPercentage: options.rollout }
        : { enabled: true };
      const result = await setRuntimeOverrideValue(
        dependencies.runtimeConfigStore,
        topic,
        id,
        patch,
        crypto.randomUUID(),
      );
      outputText(`${verb === 'clear' ? 'Cleared' : 'Set'} ${path} (${result.version}).`);
    });
}

function parseOverridePath(path: string): { topic: RuntimeOverrideTopic; id: string } {
  const [prefix, ...rest] = path.split('.');
  const topic = prefix === 'flags' ? 'features' : prefix as RuntimeOverrideTopic;
  if (!['jobs', 'sagas', 'triggers', 'features', 'tasks'].includes(topic) || !rest.length) {
    throw new Error(`Override path must be flags|jobs|sagas|triggers|tasks.<id>: ${path}`);
  }
  return { topic, id: rest.join('.') };
}

function findEntry(value: unknown, topic: RuntimeOverrideTopic, id: string): unknown {
  const key = topic === 'features' ? 'flags' : topic === 'tasks' ? 'tasks' : 'overrides';
  const entries = value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : [];
  return Array.isArray(entries) ? entries.find((entry) => (entry as { id?: string }).id === id) : undefined;
}

function parsePatch(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : { value: parsed };
  } catch {
    return { value };
  }
}
