import type { PluginCliArgs, PluginCliResult } from '@netscript/plugin/cli';
import type { TriggerContext, TriggerDefinition } from '@netscript/plugin-triggers-core/domain';
import { LocalProjectFiles, type ProjectFiles } from './adapters/local-project-files.ts';
import type { TriggersCliBackend, TriggersCliCommandDefinition } from './command-types.ts';
import {
  toTriggerFileStem,
  triggerScaffolder,
  type TriggerScaffoldKind,
} from '../scaffolding/mod.ts';
import { StaticTriggersCliBackend } from './commands.ts';
import { compileTriggerRegistry } from './trigger-registry-compiler.ts';
import {
  booleanFlag,
  createSyntheticEvent,
  fail,
  flag,
  inspectTriggerSource,
  numericFlag,
  ok,
  parseJsonFlag,
  previewCron,
  requiredValue,
  resolveTriggerDefinition,
  scaffoldInput,
  type TriggerInspectionEntry,
  type TriggersRuntimeConfig,
} from './triggers-cli-backend-support.ts';

/** Options for local triggers CLI command execution. */
export interface LocalTriggersCliBackendOptions {
  /** Project file adapter. */
  readonly files?: ProjectFiles;
}

/** Local backend that implements trigger scaffold commands against project files. */
export class LocalTriggersCliBackend implements TriggersCliBackend {
  private readonly files: ProjectFiles;
  private readonly fallback = new StaticTriggersCliBackend();

  /** Create a local triggers CLI backend. */
  constructor(options: LocalTriggersCliBackendOptions = {}) {
    this.files = options.files ?? new LocalProjectFiles();
  }

  /** Run a triggers CLI command against the local project. */
  async handle(
    definition: TriggersCliCommandDefinition,
    args: PluginCliArgs,
  ): Promise<PluginCliResult> {
    try {
      return await this.handleChecked(definition, args);
    } catch (error) {
      return { code: 1, message: error instanceof Error ? error.message : String(error) };
    }
  }

  private async handleChecked(
    definition: TriggersCliCommandDefinition,
    args: PluginCliArgs,
  ): Promise<PluginCliResult> {
    switch (definition.name) {
      case 'add-webhook':
        return await this.addTrigger('webhook', args);
      case 'add-file-watch':
        return await this.addTrigger('file-watch', args);
      case 'add-scheduled':
        return await this.addTrigger('scheduled', args);
      case 'list':
        return await this.listTriggers(args);
      case 'test':
        return await this.invokeTrigger(args, 'test');
      case 'fire':
        return await this.invokeTrigger(args, 'fire');
      case 'preview':
        return await this.previewSchedule(args);
      case 'enable':
        return await this.setTriggerEnabled(args, true);
      case 'disable':
        return await this.setTriggerEnabled(args, false);
    }
  }

  private async addTrigger(
    kind: TriggerScaffoldKind,
    args: PluginCliArgs,
  ): Promise<PluginCliResult> {
    const id = requiredValue(args, 'trigger id');
    const input = scaffoldInput(kind, id, args);
    const content = await triggerScaffolder(kind).generate(input);
    const path = `triggers/${toTriggerFileStem(id)}-trigger.ts`;
    const existing = await this.files.readTextFile(path);
    if (existing !== undefined && !input.force) {
      return fail(`Trigger file already exists: ${path}. Pass --force to overwrite.`);
    }
    await this.files.writeTextFile(path, content);
    const registry = await compileTriggerRegistry(this.files);
    return ok('Trigger definition created.', {
      files: [path, registry.registryPath],
      kind,
      id,
      registry,
    });
  }

  private async listTriggers(args: PluginCliArgs): Promise<PluginCliResult> {
    const kind = flag(args, 'kind');
    const enabledOnly = booleanFlag(args, 'enabled-only');
    const config = await this.readRuntimeConfig();
    const files = await this.files.listFiles('triggers', ['.ts']);
    const triggers = (await Promise.all(files.map(async (file) => {
      const source = await this.files.readTextFile(file.relativePath);
      return source === undefined ? undefined : inspectTriggerSource(file.relativePath, source);
    })))
      .filter((entry): entry is TriggerInspectionEntry => entry !== undefined)
      .map((entry) => ({
        ...entry,
        enabled: config.triggers[entry.id]?.enabled ?? true,
      }))
      .filter((entry) => kind === undefined || entry.kind === kind)
      .filter((entry) => !enabledOnly || entry.enabled);

    return ok(`Found ${triggers.length} trigger definitions.`, { triggers });
  }

  private async invokeTrigger(
    args: PluginCliArgs,
    mode: 'test' | 'fire',
  ): Promise<PluginCliResult> {
    const id = requiredValue(args, 'trigger id');
    const definition = await this.loadTriggerDefinition(id);
    const payload = parseJsonFlag(args, 'payload');
    const event = createSyntheticEvent(definition, payload, flag(args, 'idempotency-key'));
    const context: TriggerContext = {
      triggerId: definition.id,
      now: () => new Date(),
    };
    const actions = await definition.handler(event, context);
    return ok(mode === 'test' ? 'Trigger handler tested.' : 'Trigger fired.', {
      id: definition.id,
      kind: definition.kind,
      event,
      actions,
    });
  }

  private async previewSchedule(args: PluginCliArgs): Promise<PluginCliResult> {
    const id = requiredValue(args, 'trigger id');
    const definition = await this.loadTriggerDefinition(id);
    if (definition.kind !== 'scheduled') {
      return fail(`Trigger ${id} is not scheduled.`);
    }
    const count = numericFlag(args, 'count') ?? 5;
    if (count < 1) {
      return fail('Flag --count must be at least 1.');
    }
    return ok('Scheduled trigger preview generated.', {
      id: definition.id,
      cron: definition.cron,
      timezone: definition.timezone,
      fireTimes: previewCron(definition.cron, count).map((date) => date.toISOString()),
    });
  }

  private async setTriggerEnabled(
    args: PluginCliArgs,
    enabled: boolean,
  ): Promise<PluginCliResult> {
    const id = requiredValue(args, 'trigger id');
    const config = await this.readRuntimeConfig();
    const triggers = {
      ...config.triggers,
      [id]: { ...config.triggers[id], enabled },
    };
    const path = '.netscript/runtime/triggers.json';
    await this.files.writeTextFile(path, `${JSON.stringify({ ...config, triggers }, null, 2)}\n`);
    return ok(enabled ? 'Trigger enabled.' : 'Trigger disabled.', { id, enabled, path });
  }

  private async loadTriggerDefinition(id: string): Promise<TriggerDefinition> {
    const path = await this.findTriggerPath(id);
    if (path === undefined) {
      throw new Error(`Trigger not found: ${id}`);
    }
    const module = await import(this.files.toImportUrl(path));
    const definition = resolveTriggerDefinition(module);
    if (definition === undefined) {
      throw new Error(`Trigger module does not export a trigger definition: ${path}`);
    }
    return definition;
  }

  private async findTriggerPath(id: string): Promise<string | undefined> {
    const conventional = `triggers/${toTriggerFileStem(id)}-trigger.ts`;
    if (await this.files.readTextFile(conventional) !== undefined) {
      return conventional;
    }
    const files = await this.files.listFiles('triggers', ['.ts']);
    for (const file of files) {
      const source = await this.files.readTextFile(file.relativePath);
      if (source !== undefined && inspectTriggerSource(file.relativePath, source)?.id === id) {
        return file.relativePath;
      }
    }
    return undefined;
  }

  private async readRuntimeConfig(): Promise<TriggersRuntimeConfig> {
    const content = await this.files.readTextFile('.netscript/runtime/triggers.json');
    return content === undefined ? { triggers: {} } : JSON.parse(content) as TriggersRuntimeConfig;
  }
}
