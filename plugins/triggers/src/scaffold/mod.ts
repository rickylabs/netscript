/**
 * Triggers plugin-owned scaffold entrypoint.
 *
 * @module
 */

import type { PluginScaffoldEntrypoint } from '@netscript/plugin/protocol';
import { buildTriggersScaffoldArtifacts } from './artifacts.ts';
import { writePlannedFiles } from './files.ts';

/** Context supplied by the NetScript installer to the triggers scaffolder. */
export interface ScaffolderContext {
  /** Absolute path to the target workspace root. */
  readonly workspaceRoot: string;
  /** Plugin-specific scaffold options passed by the installer. */
  readonly options: Readonly<Record<string, unknown>>;
  /** Whether the scaffolder must report planned changes without writing files. */
  readonly dryRun: boolean;
  /** Logger supplied by the host installer. */
  readonly logger: {
    readonly debug: (message: string, context?: Readonly<Record<string, unknown>>) => void;
    readonly info: (message: string, context?: Readonly<Record<string, unknown>>) => void;
    readonly warn: (message: string, context?: Readonly<Record<string, unknown>>) => void;
    readonly error: (message: string, context?: Readonly<Record<string, unknown>>) => void;
  };
}

/** Result returned by the triggers plugin-owned scaffolder. */
export interface ScaffoldResult {
  /** Whether the scaffolder applied changes, planned changes, skipped work, or failed. */
  readonly status: 'applied' | 'planned' | 'skipped' | 'failed';
  /** Workspace-relative files created or planned by the scaffolder. */
  readonly createdFiles: readonly string[];
  /** Workspace-relative files modified or planned by the scaffolder. */
  readonly modifiedFiles: readonly string[];
  /** Whether database migration or schema files were added or planned. */
  readonly databaseMigrationsAdded: boolean;
}

interface CliScaffolderContext {
  readonly workspaceRoot: string;
  readonly options: Readonly<Record<string, unknown>>;
  readonly dryRun: boolean;
}

/** Scaffold the triggers plugin artifacts into a NetScript workspace. */
export async function scaffold(context: ScaffolderContext): Promise<ScaffoldResult> {
  const pluginName = readPluginName(context.options);
  const artifacts = await buildTriggersScaffoldArtifacts({ pluginName });
  const result = await writePlannedFiles(context.workspaceRoot, artifacts, context.dryRun);
  const changed = result.createdFiles.length > 0 || result.modifiedFiles.length > 0;

  return {
    status: context.dryRun ? 'planned' : changed ? 'applied' : 'skipped',
    createdFiles: result.createdFiles,
    modifiedFiles: result.modifiedFiles,
    databaseMigrationsAdded: artifacts.some((artifact) => artifact.path.endsWith('.prisma')),
  };
}

const scaffoldContract: PluginScaffoldEntrypoint = scaffold;
void scaffoldContract;

if (import.meta.main) {
  await runScaffoldCli();
}

/** Run the scaffold entrypoint using the S4 `--context-json` argv contract. */
export async function runScaffoldCli(): Promise<void> {
  const context = readContextArgument();
  const result = await scaffold({
    ...context,
    logger: {
      debug: () => undefined,
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    },
  });
  await Deno.stdout.write(new TextEncoder().encode(`${JSON.stringify(result)}\n`));
}

function readContextArgument(): CliScaffolderContext {
  const index = Deno.args.indexOf('--context-json');
  if (index < 0 || Deno.args[index + 1] === undefined) {
    throw new Error('Missing --context-json.');
  }

  return parseContext(JSON.parse(Deno.args[index + 1]));
}

function parseContext(value: unknown): CliScaffolderContext {
  if (value === null || typeof value !== 'object') {
    throw new Error('Scaffolder context must be an object.');
  }

  const workspaceRoot = Reflect.get(value, 'workspaceRoot');
  const options = Reflect.get(value, 'options');
  const dryRun = Reflect.get(value, 'dryRun');

  if (typeof workspaceRoot !== 'string' || workspaceRoot.length === 0) {
    throw new Error('Scaffolder context requires workspaceRoot.');
  }
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('Scaffolder context requires options.');
  }
  if (typeof dryRun !== 'boolean') {
    throw new Error('Scaffolder context requires dryRun.');
  }

  return { workspaceRoot, options, dryRun };
}

function readPluginName(options: Readonly<Record<string, unknown>>): string {
  const pluginName = Reflect.get(options, 'pluginName');
  if (typeof pluginName !== 'string' || !/^[a-z][a-z0-9-]*$/.test(pluginName)) {
    throw new Error('Triggers scaffolder requires a kebab-case options.pluginName.');
  }
  return pluginName;
}
