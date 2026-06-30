import type { NetScriptPlugin } from '../contract.ts';

/** Structured report returned by the mandatory info command. */
export interface PluginInfoReport {
  /** Published plugin package name. */
  readonly name: string;
  /** Plugin kind used by host routing. */
  readonly kind: string;
  /** Human-readable display name. */
  readonly displayName: string;
  /** Reported plugin version when statically available. */
  readonly version?: string;
  /** Human-readable plugin capabilities. */
  readonly capabilities: readonly string[];
  /** Optional resource names supported by this plugin. */
  readonly resources: readonly string[];
}

/** Input consumed by the mandatory info command. */
export interface RunInfoCommandOptions {
  /** Plugin contract supplying info seams. */
  readonly plugin: NetScriptPlugin;
}

/**
 * Run the core-owned plugin info algorithm.
 *
 * @param options Plugin contract.
 * @returns Static plugin information report.
 *
 * @example
 * ```ts
 * const info = runInfoCommand({ plugin });
 * console.log(info.kind);
 * ```
 */
export function runInfoCommand(options: RunInfoCommandOptions): PluginInfoReport {
  return {
    name: options.plugin.name,
    kind: options.plugin.kind,
    displayName: options.plugin.displayName,
    version: options.plugin.info?.version,
    capabilities: options.plugin.info?.capabilities ?? [],
    resources: (options.plugin.resources ?? []).map((resource) => resource.name),
  };
}
