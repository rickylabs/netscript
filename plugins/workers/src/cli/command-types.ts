import type { PluginCliArgs, PluginCliResult } from '@netscript/plugin/cli';
import type { WorkersCommandDefinition } from '@netscript/plugin-workers-core/abstracts';

/** Worker CLI commands exposed through the plugin CLI subpath. */
export const WORKERS_CLI_COMMANDS = [
  'add-job',
  'add-task',
  'add-workflow',
  'list-jobs',
  'list-tasks',
  'show-job',
  'show-task',
  'executions',
  'trigger',
  'run',
  'run-task',
  'update-job',
  'update-task',
  'remove-job',
  'remove-task',
  'logs',
  'config-edit',
  'config-publish',
  'enable',
  'disable',
  'compile-registry',
] as const;

/** Worker CLI command identifier. */
export type WorkersCliCommandName = typeof WORKERS_CLI_COMMANDS[number];

/** Worker CLI command category used for grouped help output. */
export type WorkersCliCategory = 'jobs' | 'tasks' | 'runtime' | 'config' | 'registry';

/** Flag metadata shown by host CLI help renderers. */
export interface WorkersCliFlagDefinition {
  /** Long flag name without the `--` prefix. */
  readonly name: string;
  /** Short description for command help. */
  readonly description: string;
  /** Whether the command requires the flag. */
  readonly required?: boolean;
}

/** Workers command definition mounted by the plugin CLI. */
export interface WorkersCliCommandDefinition extends WorkersCommandDefinition {
  /** Stable command name mounted by the host CLI. */
  readonly name: WorkersCliCommandName;
  /** Category used for grouped command discovery. */
  readonly category: WorkersCliCategory;
  /** Human-readable command description. */
  readonly description: string;
  /** Canonical user-facing invocation. */
  readonly usage: string;
  /** Flags accepted by the command. */
  readonly flags?: readonly WorkersCliFlagDefinition[];
}

/** Backend invoked by concrete command classes. */
export interface WorkersCliBackend {
  /** Run a workers CLI command. */
  handle(
    definition: WorkersCliCommandDefinition,
    args: PluginCliArgs,
  ): PluginCliResult | Promise<PluginCliResult>;
}
