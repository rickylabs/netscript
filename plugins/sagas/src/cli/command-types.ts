import type { PluginCliArgs, PluginCliResult } from '@netscript/plugin/cli';

/** Saga CLI commands exposed through the plugin CLI subpath. */
export const SAGAS_CLI_COMMANDS = [
  'generate-registry',
  'inspect',
  'codemod',
] as const;

/** Saga CLI command identifier. */
export type SagasCliCommandName = typeof SAGAS_CLI_COMMANDS[number];

/** Saga CLI command category used for grouped help output. */
export type SagasCliCategory = 'registry' | 'inspection' | 'migration';

/** Flag metadata shown by host CLI help renderers. */
export interface SagasCliFlagDefinition {
  /** Long flag name without the `--` prefix. */
  readonly name: string;
  /** Short description for command help. */
  readonly description: string;
  /** Whether the command requires the flag. */
  readonly required?: boolean;
}

/** Sagas command definition mounted by the plugin CLI. */
export interface SagasCliCommandDefinition {
  /** Stable command name mounted by the host CLI. */
  readonly name: SagasCliCommandName;
  /** Category used for grouped command discovery. */
  readonly category: SagasCliCategory;
  /** Human-readable command description. */
  readonly description: string;
  /** Canonical user-facing invocation. */
  readonly usage: string;
  /** Flags accepted by the command. */
  readonly flags?: readonly SagasCliFlagDefinition[];
}

/** Backend invoked by concrete command classes. */
export interface SagasCliBackend {
  /** Run a sagas CLI command. */
  handle(
    definition: SagasCliCommandDefinition,
    args: PluginCliArgs,
  ): PluginCliResult | Promise<PluginCliResult>;
}
