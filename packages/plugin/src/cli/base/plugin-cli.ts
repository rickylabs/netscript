import type { PluginCliCommand } from '../types.ts';

/** Abstract base class for plugin-owned CLI command groups. */
export abstract class PluginCli {
  /** Plugin CLI group name. */
  abstract readonly name: string;
  /** Plugin CLI group description. */
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
}
