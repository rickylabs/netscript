import type { PluginCliArgs, PluginCliResult } from '../../cli/mod.ts';
import type { NetScriptPlugin, PluginCommandContext, PluginResource } from '../contract.ts';
import { runDoctorCommand } from '../commands/doctor.ts';
import { runInfoCommand } from '../commands/info.ts';
import { runInstallCommand } from '../commands/install.ts';
import { runRemoveCommand } from '../commands/remove.ts';
import { runUpdateCommand } from '../commands/update.ts';

/** Input consumed by the plugin CLI runner. */
export interface RunPluginCliCommandOptions {
  /** Plugin contract supplying command seams and handlers. */
  readonly plugin: NetScriptPlugin;
  /** Parsed CLI arguments. */
  readonly args: PluginCliArgs;
  /** Shared command context. */
  readonly context: PluginCommandContext;
}

/**
 * Route a plugin CLI verb to mandatory logic or a plugin-owned handler.
 *
 * @param options Plugin contract, CLI args, and command context.
 * @returns CLI command result.
 *
 * @example
 * ```ts
 * const result = await runPluginCliCommand({ plugin, args: { command: 'info' }, context });
 * console.log(result.code);
 * ```
 */
export async function runPluginCliCommand(
  options: RunPluginCliCommandOptions,
): Promise<PluginCliResult> {
  switch (options.args.command) {
    case 'install':
      return scaffoldResultToCliResult(
        await runInstallCommand({ plugin: options.plugin, context: options.context }),
      );
    case 'doctor':
      return { code: 0, data: await runDoctorCommand(options) };
    case 'info':
      return { code: 0, data: runInfoCommand({ plugin: options.plugin }) };
    case 'update':
      return runUpdateCommand({ plugin: options.plugin });
    case 'remove':
      return options.args.values?.length &&
          options.plugin.commands?.some((item) => item.verb === 'remove')
        ? await runExtraCommand(options)
        : runRemoveCommand({ plugin: options.plugin });
    case 'add':
    case 'generate':
      return await runResourceCommand(options);
    default:
      return await runExtraCommand(options);
  }
}

async function runResourceCommand(
  options: RunPluginCliCommandOptions,
): Promise<PluginCliResult> {
  const resourceName = options.args.values?.[0];
  const resource = (options.plugin.resources ?? []).find((item) => item.name === resourceName);
  if (!resource) {
    return {
      code: 1,
      message: resourceName ? `Unknown resource: ${resourceName}` : 'Missing resource name.',
    };
  }

  const input = await readResourceInput(resource, options.args);
  const artifacts = resource.scaffolder.emit(input);
  const result = await runInstallCommand({
    plugin: {
      ...options.plugin,
      install: {
        ...options.plugin.install,
        starterResources: [{ scaffolder: resource.scaffolder, input }],
      },
    },
    context: options.context,
  });

  if (result.status !== 'failed' && !options.context.dryRun) {
    await resource.afterWrite?.(options.context);
  }

  return {
    code: result.status === 'failed' ? 1 : 0,
    message: `${options.args.command} ${resource.name}: ${artifacts.length} artifact(s).`,
    data: result,
  };
}

async function readResourceInput<TInput>(
  resource: PluginResource<TInput>,
  args: PluginCliArgs,
): Promise<TInput> {
  if (resource.parseInput) {
    return await resource.parseInput(args);
  }
  if (resource.defaultInput !== undefined) {
    return resource.defaultInput;
  }
  throw new TypeError(`Resource ${resource.name} requires parseInput or defaultInput.`);
}

async function runExtraCommand(options: RunPluginCliCommandOptions): Promise<PluginCliResult> {
  const command = (options.plugin.commands ?? []).find((item) =>
    item.verb === options.args.command
  );
  if (!command) {
    return { code: 1, message: `Unknown command: ${options.args.command}` };
  }
  return await command.run(options.args, options.context);
}

interface CliScaffoldResult {
  readonly status: 'applied' | 'planned' | 'skipped' | 'failed';
  readonly createdFiles: readonly string[];
  readonly modifiedFiles: readonly string[];
}

function scaffoldResultToCliResult(result: CliScaffoldResult): PluginCliResult {
  return {
    code: result.status === 'failed' ? 1 : 0,
    message:
      `Install ${result.status}: ${result.createdFiles.length} created, ${result.modifiedFiles.length} modified.`,
    data: result,
  };
}
