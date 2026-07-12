import type { PluginCliArgs, PluginCliResult } from '@netscript/plugin/cli';
import { artifactText, type ScaffoldArtifact } from '@netscript/plugin/adapter';
import type { TriggerContext, TriggerDefinition } from '@netscript/plugin-triggers-core/domain';
import { computeNextFireTimes } from '@netscript/plugin-triggers-core/runtime';
import {
  fileStem,
  fileWatchScaffolder,
  parseFileWatchInput,
  parseScheduledInput,
  parseWebhookInput,
  scheduledScaffolder,
  webhookScaffolder,
} from '../adapter/resources/mod.ts';
import { LocalProjectFiles, type ProjectFiles } from '@netscript/plugin/cli';
import type { TriggersCliBackend, TriggersCliCommandDefinition } from './command-types.ts';
import { HttpTriggersService, type TriggersServiceClient } from './http-triggers-service.ts';
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
  requiredValue,
  resolveTriggerDefinition,
  type TriggerInspectionEntry,
} from './triggers-cli-backend-support.ts';
import { type TriggerSourceUpdates, updateTriggerSource } from './trigger-source-editor.ts';

/** Options for local triggers runtime CLI command execution. */
export interface LocalTriggersRuntimeBackendOptions {
  /** Project file adapter. */
  readonly files?: ProjectFiles;
  /** Running triggers service adapter. */
  readonly service?: TriggersServiceClient;
}

/** Local backend that implements trigger scaffold commands against project files. */
export class LocalTriggersRuntimeBackend implements TriggersCliBackend {
  private readonly files: ProjectFiles;
  private readonly service: TriggersServiceClient;

  /** Create a local triggers runtime backend. */
  constructor(options: LocalTriggersRuntimeBackendOptions = {}) {
    this.files = options.files ?? new LocalProjectFiles();
    this.service = options.service ?? new HttpTriggersService();
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
      case 'events':
        return await this.listEvents(args);
      case 'update':
        return await this.updateTrigger(args);
      case 'remove':
        return await this.removeTrigger(args);
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

  /** Rewrite supported static trigger fields and refresh the registry. */
  private async updateTrigger(args: PluginCliArgs): Promise<PluginCliResult> {
    const id = requiredValue(args, 'trigger id');
    const path = await this.findTriggerPath(id);
    if (path === undefined) return fail(`Trigger not found: ${id}`);
    const source = await this.files.readTextFile(path);
    if (source === undefined) return fail(`Trigger source disappeared: ${path}`);
    const inspection = inspectTriggerSource(path, source);
    if (inspection === undefined) return fail(`Unable to inspect trigger source: ${path}`);
    const updates = triggerSourceUpdates(args);
    const updated = updateTriggerSource(source, inspection.kind, updates);
    await this.files.writeTextFile(path, updated);
    const registry = await compileTriggerRegistry(this.files);
    return ok('Trigger definition updated.', {
      id,
      file: path,
      updates,
      registry,
    });
  }

  /** Remove a code-defined trigger and refresh the registry. */
  private async removeTrigger(args: PluginCliArgs): Promise<PluginCliResult> {
    const id = requiredValue(args, 'trigger id');
    const path = await this.findTriggerPath(id);
    if (path === undefined) return fail(`Trigger not found: ${id}`);
    if (this.files.removeFile === undefined) {
      return fail('The configured project file adapter does not support removal.');
    }
    if (!await this.files.removeFile(path)) return fail(`Trigger not found: ${id}`);
    const registry = await compileTriggerRegistry(this.files);
    return ok('Trigger definition removed.', { id, file: path, registry });
  }

  /** List persisted trigger events through the running service. */
  private async listEvents(args: PluginCliArgs): Promise<PluginCliResult> {
    const limit = numericFlag(args, 'limit') ?? 50;
    if (!Number.isInteger(limit) || limit < 1) {
      return fail('Flag --limit must be a positive integer.');
    }
    const status = flag(args, 'status');
    const page = await this.service.listEvents({
      triggerId: args.values?.[0],
      status: parseEventStatus(status),
      limit,
    });
    return ok(`Found ${page.events.length} persisted trigger events.`, {
      ...page,
      format: booleanFlag(args, 'json') ? 'json' : 'table',
    });
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
    const enabledIds = booleanFlag(args, 'enabled-only')
      ? new Set((await this.service.listTriggers(true)).map((trigger) => trigger.id))
      : undefined;
    const files = await this.files.listFiles('triggers', ['.ts']);
    const triggers = (await Promise.all(files.map(async (file) => {
      const source = await this.files.readTextFile(file.relativePath);
      return source === undefined ? undefined : inspectTriggerSource(file.relativePath, source);
    })))
      .filter((entry): entry is TriggerInspectionEntry => entry !== undefined)
      .filter((entry) => kind === undefined || entry.kind === kind)
      .filter((entry) => !enabledOnly || enabledIds?.has(entry.id));

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
      fireTimes: computeNextFireTimes(definition, count),
    });
  }

  /** Set enabled state through the authoritative running service. */
  private async setTriggerEnabled(
    args: PluginCliArgs,
    enabled: boolean,
  ): Promise<PluginCliResult> {
    const id = requiredValue(args, 'trigger id');
    const state = await this.service.setEnabled(id, enabled);
    return ok(enabled ? 'Trigger enabled.' : 'Trigger disabled.', state);
  }

  /** Load a trigger definition module by trigger id. */
  private async loadTriggerDefinition(id: string): Promise<TriggerDefinition> {
    const path = await this.findTriggerPath(id);
    if (path === undefined) {
      throw new Error(`Trigger not found: ${id}`);
    }
    const module = await import(`${this.files.toImportUrl(path)}?cli=${crypto.randomUUID()}`);
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
}

function triggerSourceUpdates(args: PluginCliArgs): TriggerSourceUpdates {
  const tags = flag(args, 'tags');
  return {
    cron: flag(args, 'cron'),
    timezone: flag(args, 'timezone'),
    path: flag(args, 'path'),
    verifier: flag(args, 'verifier'),
    secretEnv: flag(args, 'secret-env'),
    description: flag(args, 'description'),
    tags: tags?.split(',').map((tag) => tag.trim()).filter(Boolean),
  };
}

function parseEventStatus(value: string | undefined):
  | 'pending'
  | 'in-flight'
  | 'deferred'
  | 'completed'
  | 'failed'
  | 'dlq'
  | undefined {
  if (value === undefined) return undefined;
  if (
    value === 'pending' || value === 'in-flight' || value === 'deferred' ||
    value === 'completed' || value === 'failed' || value === 'dlq'
  ) {
    return value;
  }
  throw new Error(`Unknown trigger event status: ${value}.`);
}
