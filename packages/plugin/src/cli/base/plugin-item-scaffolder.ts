/** Result returned by plugin item scaffolders. */
export interface PluginScaffoldResult {
  /** Files written or planned by the scaffolder. */
  readonly files: readonly string[];
  /** Non-fatal warnings reported by the scaffolder. */
  readonly warnings?: readonly string[];
}

/** Abstract base for plugin `add <item>` scaffolders. */
export abstract class PluginItemScaffolder<TInput> {
  /** Item name accepted by the scaffolder. */
  abstract readonly itemName: string;

  /**
   * Scaffold a plugin-owned item.
   *
   * @param input - Validated scaffolding input.
   * @returns Files written or planned by the scaffolder.
   */
  abstract scaffold(input: TInput): PluginScaffoldResult | Promise<PluginScaffoldResult>;
}
