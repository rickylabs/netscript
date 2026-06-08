/** Command arguments passed to plugin CLI handlers. */
export interface PluginCliArgs {
  /** Command name selected by the host CLI. */
  readonly command: string;
  /** Parsed option flags passed to the command. */
  readonly flags?: Record<string, string | boolean | number>;
  /** Positional values passed to the command. */
  readonly values?: readonly string[];
}

/** Result returned by plugin CLI handlers. */
export interface PluginCliResult {
  /** Process-style exit code for the command result. */
  readonly code: number;
  /** Optional human-readable result message. */
  readonly message?: string;
  /** Optional structured payload for programmatic callers. */
  readonly data?: unknown;
}

/** A mounted CLI command handler. */
export interface PluginCliCommand {
  /** Command name exposed under the plugin CLI. */
  readonly name: string;
  /** Short command description for help output. */
  readonly description: string;
  /** Run the command with parsed arguments. */
  readonly run: (args: PluginCliArgs) => PluginCliResult | Promise<PluginCliResult>;
}
