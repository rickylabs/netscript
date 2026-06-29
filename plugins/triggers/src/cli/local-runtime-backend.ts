import type { PluginCliArgs, PluginCliResult } from '@netscript/plugin/cli';
import { artifactText, type ScaffoldArtifact } from '@netscript/plugin/adapter';
import type { TriggerContext, TriggerDefinition } from '@netscript/plugin-triggers-core/domain';
import {
  fileStem,
  fileWatchScaffolder,
  parseFileWatchInput,
  parseScheduledInput,
  parseWebhookInput,
  scheduledScaffolder,
  webhookScaffolder,
} from '../adapter/resources/mod.ts';
import { LocalProjectFiles, type ProjectFiles } from './adapters/local-project-files.ts';
import type { TriggersCliBackend, TriggersCliCommandDefinition } from './command-types.ts';
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
  type TriggerInspectionEntry,
  type TriggersRuntimeConfig,
} from './triggers-cli-backend-support.ts';

/** Options for local triggers runtime CLI command execution. */
export interface LocalTriggersRuntimeBackendOptions {
  /** Project file adapter. */
  readonly files?: ProjectFiles;
}

/** Local backend that implements trigger scaffold commands against project files. */
export class LocalTriggersRuntimeBackend implements TriggersCliBackend {
  private readonly files: ProjectFiles;

  /** Create a local triggers runtime backend. */
  constructor(options: LocalTriggersRuntimeBackendOptions = {}) {
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

  /** Dispatch a validated command definition to its local handler. */
  private async handleChecked(
    definition: TriggersCliCommandDefinition,
    args: PluginCliArgs,
  ): Promise<PluginCliResult> {
    switch (definition.name) {
      case 'add-webhook': {
        const input = parseWebhookInput(args);
        return await this.addTrigger(webhookScaffolder.emit(input), input.force ?? false);
      }
      case 'add-file-watch': {
        const input = parseFileWatchInput(args);
        return await this.addTrigger(fileWatchScaffolder.emit(input), input.force ?? false);
      }
      case 'add-scheduled': {
        const input = parseScheduledInput(args);
        return await this.addTrigger(scheduledScaffolder.emit(input), input.force ?? false);
      }
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

  /** Write one trigger definition and refresh the generated registry. */
  private async addTrigger(
    artifacts: readonly ScaffoldArtifact[],
    force: boolean,
  ): Promise<PluginCliResult> {
    const [artifact] = artifacts;
    if (artifact === undefined) {
      return fail('No trigger artifact generated.');
    }
    const path = artifact.path;
    const existing = await this.files.readTextFile(path);
    if (existing !== undefined && !force) {
      return fail(`Trigger file already exists: ${path}. Pass --force to overwrite.`);
    }
    await this.files.writeTextFile(path, artifactText(artifact));
    const registry = await compileTriggerRegistry(this.files);
    return ok('Trigger definition created.', {
      files: [path, registry.registryPath],
      registry,
    });
  }

  /** List discovered trigger definitions with optional filters. */
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

  /** Invoke a trigger handler in test or fire mode. */
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

  /** Preview upcoming fire times for a scheduled trigger. */
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

  /** Persist the enabled state for a trigger id. */
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

  /** Load a trigger definition module by trigger id. */
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

  /** Find the project-relative module path for a trigger id. */
  private async findTriggerPath(id: string): Promise<string | undefined> {
    const conventional = `triggers/${fileStem(id)}-trigger.ts`;
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

  /** Read runtime trigger configuration, defaulting to an empty config. */
  private async readRuntimeConfig(): Promise<TriggersRuntimeConfig> {
    const content = await this.files.readTextFile('.netscript/runtime/triggers.json');
    return content === undefined ? { triggers: {} } : JSON.parse(content) as TriggersRuntimeConfig;
  }
}
