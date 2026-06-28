/**
 * Workers plugin-owned scaffold entrypoint.
 *
 * @module
 */

import type { ScaffolderContext, ScaffoldResult } from '@netscript/plugin/protocol';
import { buildWorkerScaffoldArtifacts } from './artifacts.ts';
import { writePlannedFiles } from './files.ts';

interface CliScaffolderContext {
  readonly workspaceRoot: string;
  readonly options: Readonly<Record<string, unknown>>;
  readonly dryRun: boolean;
}

/** Scaffold the workers plugin artifacts into a NetScript workspace. */
export async function scaffold(context: ScaffolderContext): Promise<ScaffoldResult> {
  const pluginName = readPluginName(context.options);
  const artifacts = buildWorkerScaffoldArtifacts({ pluginName });
  const result = await writePlannedFiles(context.workspaceRoot, artifacts, context.dryRun);
  const changed = result.createdFiles.length > 0 || result.modifiedFiles.length > 0;

  return {
    status: context.dryRun ? 'planned' : changed ? 'applied' : 'skipped',
    createdFiles: result.createdFiles,
    modifiedFiles: result.modifiedFiles,
    databaseMigrationsAdded: artifacts.some((artifact) => artifact.path.endsWith('.prisma')),
  };
}

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
    throw new Error('Workers scaffolder requires a kebab-case options.pluginName.');
  }
  return pluginName;
}
