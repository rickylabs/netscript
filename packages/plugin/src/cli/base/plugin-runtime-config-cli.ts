import type { PluginCliArgs, PluginCliResult } from '../types.ts';

/** Abstract base for plugin runtime configuration commands. */
export abstract class PluginRuntimeConfigCli {
  /** Runtime configuration topic managed by this CLI. */
  abstract readonly topic: string;

  /** Read the runtime config topic. */
  abstract read(args: PluginCliArgs): PluginCliResult | Promise<PluginCliResult>;

  /** Write the runtime config topic. */
  abstract write(args: PluginCliArgs): PluginCliResult | Promise<PluginCliResult>;
}
