/** Result returned by plugin item scaffolders. */
export interface PluginScaffoldResult {
  readonly files: readonly string[];
  readonly warnings?: readonly string[];
}

/** Abstract base for plugin `add <item>` scaffolders. */
export abstract class PluginItemScaffolder<TInput> {
  abstract readonly itemName: string;

  /**
   * Scaffold a plugin-owned item.
   *
   * @param input - Validated scaffolding input.
   * @returns Files written or planned by the scaffolder.
   */
  abstract scaffold(input: TInput): PluginScaffoldResult | Promise<PluginScaffoldResult>;
}
