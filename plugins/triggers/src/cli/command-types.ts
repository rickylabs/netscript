import type { PluginCliArgs, PluginCliResult } from '@netscript/plugin/cli';

/** Trigger CLI commands exposed through the plugin CLI subpath. */
export const TRIGGERS_CLI_COMMANDS = [
  'add-webhook',
  'add-file-watch',
  'add-scheduled',
  'list',
  'events',
  'update',
  'remove',
  'test',
  'fire',
  'preview',
  'enable',
  'disable',
] as const;

/** Trigger CLI command identifier. */
export type TriggersCliCommandName = typeof TRIGGERS_CLI_COMMANDS[number];

/** Trigger CLI command category used for grouped help output. */
export type TriggersCliCategory = 'scaffolding' | 'inspection' | 'runtime' | 'schedule';

/** Flag metadata shown by host CLI help renderers. */
export interface TriggersCliFlagDefinition {
  /** Long flag name without the `--` prefix. */
  readonly name: string;
  /** Short description for command help. */
  readonly description: string;
  /** Whether the command requires the flag. */
  readonly required?: boolean;
}

/** Triggers command definition mounted by the plugin CLI. */
export interface TriggersCliCommandDefinition {
  /** Stable command name mounted by the host CLI. */
  readonly name: TriggersCliCommandName;
  /** Category used for grouped command discovery. */
  readonly category: TriggersCliCategory;
  /** Human-readable command description. */
  readonly description: string;
  /** Canonical user-facing invocation. */
  readonly usage: string;
  /** Flags accepted by the command. */
  readonly flags?: readonly TriggersCliFlagDefinition[];
}

/** Backend invoked by concrete command classes. */
export interface TriggersCliBackend {
  /** Run a triggers CLI command. */
  handle(
    definition: TriggersCliCommandDefinition,
    args: PluginCliArgs,
  ): PluginCliResult | Promise<PluginCliResult>;
}
