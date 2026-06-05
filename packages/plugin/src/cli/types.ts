/** Command arguments passed to plugin CLI handlers. */
export interface PluginCliArgs {
  readonly command: string;
  readonly flags?: Record<string, string | boolean | number>;
  readonly values?: readonly string[];
}

/** Result returned by plugin CLI handlers. */
export interface PluginCliResult {
  readonly code: number;
  readonly message?: string;
  readonly data?: unknown;
}

/** A mounted CLI command handler. */
export interface PluginCliCommand {
  readonly name: string;
  readonly description: string;
  readonly run: (args: PluginCliArgs) => PluginCliResult | Promise<PluginCliResult>;
}
