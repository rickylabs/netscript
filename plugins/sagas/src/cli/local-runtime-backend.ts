import type { PluginCliArgs, PluginCliResult } from '@netscript/plugin/cli';
import { artifactText, type ScaffoldArtifact } from '@netscript/plugin/adapter';
import { parseSagaInput, sagaScaffolder } from '../adapter/resources/mod.ts';
import { LocalProjectFiles, type ProjectFiles } from '@netscript/plugin/cli';
import { codemodSagaImports } from './codemod.ts';
import {
  FetchSagasRuntimeApiClient,
  type SagasRuntimeApiClient,
} from './adapters/runtime-api-client.ts';
import type { SagasCliBackend, SagasCliCommandDefinition } from './command-types.ts';
import { upsertFluentCall } from './fluent-call-editor.ts';
import { generateSagaRegistry } from './registry-generator.ts';
import { inspectSagasProject, type InspectSagasResult } from './saga-inspector.ts';

/** Options for local sagas runtime CLI command execution. */
export interface LocalSagasRuntimeBackendOptions {
  /** Project file adapter. */
  readonly files?: ProjectFiles;
  /** Durable sagas API client. */
  readonly runtime?: SagasRuntimeApiClient;
}

/** Backend for local saga source management and durable runtime commands. */
export class LocalSagasRuntimeBackend implements SagasCliBackend {
  readonly #files: ProjectFiles;
  readonly #runtime: SagasRuntimeApiClient;

  /** Create a local sagas runtime backend. */
  constructor(options: LocalSagasRuntimeBackendOptions = {}) {
    this.#files = options.files ?? new LocalProjectFiles();
    this.#runtime = options.runtime ?? new FetchSagasRuntimeApiClient();
  }

  /** Run a sagas CLI command against project files or the durable runtime. */
  async handle(
    definition: SagasCliCommandDefinition,
    args: PluginCliArgs,
  ): Promise<PluginCliResult> {
    try {
      return await this.handleChecked(definition, args);
    } catch (error) {
      return { code: 1, message: error instanceof Error ? error.message : String(error) };
    }
  }

  /** Dispatch a command after outer error normalization is installed. */
  private async handleChecked(
    definition: SagasCliCommandDefinition,
    args: PluginCliArgs,
  ): Promise<PluginCliResult> {
    switch (definition.name) {
      case 'generate-registry':
        return ok('Saga registry generated.', await this.generate(args));
      case 'publish':
        return await this.publish(args);
      case 'list':
        return await this.list(args);
      case 'inspect':
        return await this.inspect(args);
      case 'update-saga':
        return await this.updateSaga(args);
      case 'remove-saga':
        return await this.removeSaga(args);
      case 'codemod': {
        const result = await codemodSagaImports(this.#files, {
          roots: rootsFlag(args),
          write: booleanFlag(args, 'write'),
        });
        return ok(
          result.write ? 'Saga import codemod applied.' : 'Saga import codemod planned.',
          result,
        );
      }
      case 'add-saga':
        return await this.writeArtifactsAndGenerate(
          'Saga definition created.',
          sagaScaffolder.emit(parseSagaInput(args)),
          args,
        );
    }
  }

  /** Publish one contract-shaped message through the running service. */
  private async publish(args: PluginCliArgs): Promise<PluginCliResult> {
    const type = requiredValue(args, 'message type');
    const payload = requireJsonObject(requiredJsonFlag(args, 'payload'), '--payload');
    const result = await this.#runtime.request('publish', {
      method: 'POST',
      body: {
        type,
        payload,
        correlationId: flag(args, 'correlation-key'),
        idempotencyKey: flag(args, 'idempotency-key'),
      },
    });
    return ok('Saga message published.', result);
  }

  /** List registered definitions or durable instances. */
  private async list(args: PluginCliArgs): Promise<PluginCliResult> {
    if (booleanFlag(args, 'registered') && booleanFlag(args, 'instances')) {
      throw new Error('Choose either --registered or --instances, not both.');
    }
    const instances = booleanFlag(args, 'instances');
    const result = await this.#runtime.request(instances ? 'instances' : 'sagas', {
      query: instances ? { status: flag(args, 'status'), sagaName: flag(args, 'saga') } : undefined,
    });
    return ok(instances ? 'Saga instances loaded.' : 'Registered sagas loaded.', result);
  }

  /** Inspect runtime metadata with an offline source fallback. */
  private async inspect(args: PluginCliArgs): Promise<PluginCliResult> {
    const id = args.values?.[0];
    try {
      const runtime = await this.#runtime.request(id ? `sagas/${encodeURIComponent(id)}` : 'sagas');
      return ok('Saga runtime metadata loaded.', { source: 'runtime', runtime });
    } catch (error) {
      const local = await inspectSagasProject(this.#files, { roots: rootsFlag(args) });
      return ok(`Found ${local.entries.length} saga source files.`, {
        source: 'local',
        runtimeError: error instanceof Error ? error.message : String(error),
        ...local,
      });
    }
  }

  /** Update generated definition/config builder calls and regenerate the registry. */
  private async updateSaga(args: PluginCliArgs): Promise<PluginCliResult> {
    const id = requiredValue(args, 'saga id');
    const inspected = await inspectSagasProject(this.#files, { roots: rootsFlag(args) });
    const paths = sagaPaths(inspected, id);
    if (!paths.definition) throw new Error(`Saga definition ${id} was not found.`);
    if (!paths.config) throw new Error(`Saga config ${id} was not found.`);

    let definition = await requiredSource(this.#files, paths.definition);
    let config = await requiredSource(this.#files, paths.config);
    if (hasFlag(args, 'durability')) {
      const durability = requiredFlag(args, 'durability');
      if (!['t1', 't2', 't3'].includes(durability)) {
        throw new Error('Flag --durability must be t1, t2, or t3.');
      }
      definition = upsertFluentCall(definition, {
        anchor: 'defineSaga',
        method: 'durability',
        argument: JSON.stringify(durability),
      });
    }
    if (hasFlag(args, 'topic')) {
      config = configCall(config, 'topic', JSON.stringify(requiredFlag(args, 'topic')));
    }
    if (hasFlag(args, 'description')) {
      config = configCall(
        config,
        'description',
        JSON.stringify(requiredFlag(args, 'description')),
      );
    }
    if (hasFlag(args, 'tags')) {
      config = configCall(config, 'tags', `...${JSON.stringify(commaListFlag(args, 'tags'))}`);
    }
    await Promise.all([
      this.#files.writeTextFile(paths.definition, definition),
      this.#files.writeTextFile(paths.config, config),
    ]);
    const registry = await this.generate(args);
    return ok('Saga definition updated.', {
      id,
      files: [paths.definition, paths.config],
      registry,
    });
  }

  /** Remove generated saga files and regenerate the registry. */
  private async removeSaga(args: PluginCliArgs): Promise<PluginCliResult> {
    const id = requiredValue(args, 'saga id');
    const inspected = await inspectSagasProject(this.#files, { roots: rootsFlag(args) });
    const paths = sagaPaths(inspected, id);
    const files = [paths.definition, paths.config].filter(isString);
    if (!files.length) return fail(`Saga ${id} was not found.`);
    await Promise.all(files.map((path) => this.#files.removeFile(path)));
    const registry = await this.generate(args);
    return ok('Saga definition removed.', { id, files, registry });
  }

  /** Write generated artifacts and leave the runtime registry current. */
  private async writeArtifactsAndGenerate(
    message: string,
    artifacts: readonly ScaffoldArtifact[],
    args: PluginCliArgs,
  ): Promise<PluginCliResult> {
    for (const artifact of artifacts) {
      await this.#files.writeTextFile(artifact.path, artifactText(artifact));
    }
    const registry = await this.generate(args);
    return ok(message, { files: artifacts.map((artifact) => artifact.path), registry });
  }

  /** Generate the static saga registry using command root/output overrides. */
  private generate(args: PluginCliArgs): Promise<unknown> {
    return generateSagaRegistry(this.#files, {
      roots: rootsFlag(args),
      registryPath: flag(args, 'out'),
    });
  }
}

function configCall(source: string, method: string, argument: string): string {
  return upsertFluentCall(source, { anchor: 'defineSagaConfig', method, argument });
}

function sagaPaths(
  inspected: InspectSagasResult,
  id: string,
): Readonly<{ definition?: string; config?: string }> {
  return {
    definition: inspected.entries.find((entry) => entry.sagaIds.includes(id))?.sourcePath,
    config: inspected.entries.find((entry) => entry.configIds.includes(id))?.sourcePath,
  };
}

function requiredSource(files: ProjectFiles, path: string): Promise<string> {
  return files.readTextFile(path).then((source) => {
    if (source === undefined) throw new Error(`Saga source ${path} was not found.`);
    return source;
  });
}

function ok(message: string, data: unknown): PluginCliResult {
  return { code: 0, message, data };
}

function fail(message: string): PluginCliResult {
  return { code: 1, message };
}

function requiredValue(args: PluginCliArgs, label: string): string {
  const value = args.values?.[0];
  if (!value) throw new Error(`Missing ${label}.`);
  return value;
}

function flag(args: PluginCliArgs, name: string): string | undefined {
  const value = args.flags?.[name];
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? String(value)
    : undefined;
}

function requiredFlag(args: PluginCliArgs, name: string): string {
  const value = flag(args, name);
  if (!value) throw new Error(`Flag --${name} requires a value.`);
  return value;
}

function requiredJsonFlag(args: PluginCliArgs, name: string): unknown {
  return JSON.parse(requiredFlag(args, name));
}

function requireJsonObject(value: unknown, flagName: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${flagName} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

function hasFlag(args: PluginCliArgs, name: string): boolean {
  return Object.prototype.hasOwnProperty.call(args.flags ?? {}, name);
}

function booleanFlag(args: PluginCliArgs, name: string): boolean {
  const value = args.flags?.[name];
  return value === true || value === 'true' || value === 1 || value === '1';
}

function commaListFlag(args: PluginCliArgs, name: string): readonly string[] {
  return requiredFlag(args, name).split(',').map((item) => item.trim()).filter(Boolean);
}

function rootsFlag(args: PluginCliArgs): readonly string[] | undefined {
  const value = flag(args, 'root') ?? flag(args, 'roots');
  return value === undefined
    ? undefined
    : Object.freeze(value.split(',').map((item) => item.trim()).filter(Boolean));
}

function isString(value: string | undefined): value is string {
  return value !== undefined;
}
