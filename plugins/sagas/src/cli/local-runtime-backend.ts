import type { PluginCliArgs, PluginCliResult } from '@netscript/plugin/cli';
import { artifactText, type ScaffoldArtifact } from '@netscript/plugin/adapter';
import { parseSagaInput, sagaScaffolder } from '../adapter/resources/mod.ts';
import { LocalProjectFiles, type ProjectFiles } from './adapters/local-project-files.ts';
import { codemodSagaImports } from './codemod.ts';
import type { SagasCliBackend, SagasCliCommandDefinition } from './command-types.ts';
import { generateSagaRegistry } from './registry-generator.ts';
import { inspectSagasProject } from './saga-inspector.ts';

/** Options for local sagas runtime CLI command execution. */
export interface LocalSagasRuntimeBackendOptions {
  /** Project file adapter. */
  readonly files?: ProjectFiles;
}

/** Local backend that implements sagas CLI verbs against project files. */
export class LocalSagasRuntimeBackend implements SagasCliBackend {
  private readonly files: ProjectFiles;

  /** Create a local sagas runtime backend. */
  constructor(options: LocalSagasRuntimeBackendOptions = {}) {
    this.files = options.files ?? new LocalProjectFiles();
  }

  /** Run a sagas CLI command against the local project. */
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

  /** Execute a validated sagas command after outer error handling is installed. */
  private async handleChecked(
    definition: SagasCliCommandDefinition,
    args: PluginCliArgs,
  ): Promise<PluginCliResult> {
    switch (definition.name) {
      case 'generate-registry': {
        const result = await generateSagaRegistry(this.files, {
          roots: rootsFlag(args),
          registryPath: flag(args, 'out'),
        });
        return ok('Saga registry generated.', result);
      }
      case 'inspect': {
        const result = await inspectSagasProject(this.files, { roots: rootsFlag(args) });
        return ok(`Found ${result.entries.length} saga source files.`, result);
      }
      case 'codemod': {
        const result = await codemodSagaImports(this.files, {
          roots: rootsFlag(args),
          write: booleanFlag(args, 'write'),
        });
        return ok(
          result.write ? 'Saga import codemod applied.' : 'Saga import codemod planned.',
          result,
        );
      }
      case 'add-saga':
        return await this.writeArtifacts(
          'Saga definition created.',
          sagaScaffolder.emit(parseSagaInput(args)),
        );
    }
  }

  private async writeArtifacts(
    message: string,
    artifacts: readonly ScaffoldArtifact[],
  ): Promise<PluginCliResult> {
    for (const artifact of artifacts) {
      await this.files.writeTextFile(artifact.path, artifactText(artifact));
    }
    return ok(message, { files: artifacts.map((artifact) => artifact.path) });
  }
}

function ok(message: string, data: unknown): PluginCliResult {
  return { code: 0, message, data };
}

function flag(args: PluginCliArgs, name: string): string | undefined {
  const value = args.flags?.[name];
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

function booleanFlag(args: PluginCliArgs, name: string): boolean {
  const value = args.flags?.[name];
  return value === true || value === 'true' || value === 1 || value === '1';
}

function rootsFlag(args: PluginCliArgs): readonly string[] | undefined {
  const value = flag(args, 'root') ?? flag(args, 'roots');
  return value === undefined
    ? undefined
    : Object.freeze(value.split(',').map((item) => item.trim()).filter(Boolean));
}
