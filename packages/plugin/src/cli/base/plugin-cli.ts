import type { PluginCliArgs, PluginCliCommand, PluginCliResult } from '../types.ts';

/** Abstract base class for plugin-owned CLI command groups. */
export abstract class PluginCli {
  abstract readonly name: string;
  abstract readonly description: string;

  /**
   * Return commands exposed by this plugin CLI.
   *
   * @returns Commands that can be mounted by the host CLI.
   *
   * @example
   * ```ts
   * class EmptyCli extends PluginCli {
   *   readonly name = "empty";
   *   readonly description = "Empty CLI";
   *   commands() { return []; }
   * }
   * ```
   */
  abstract commands(): readonly PluginCliCommand[];

  /** Run a named command from this CLI. */
  async run(args: PluginCliArgs): Promise<PluginCliResult> {
    const command = this.commands().find((item) => item.name === args.command);
    if (!command) {
      return { code: 1, message: `Unknown command: ${args.command}` };
    }
    return await command.run(args);
  }
}
