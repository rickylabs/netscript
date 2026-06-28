/** Shared Deno configuration values for a generated plugin scaffold. */
export interface PluginDenoJsonSpec {
  /** Kebab-case plugin directory name used in the generated package name. */
  readonly pluginName: string;
  /** Export map for the generated plugin package. */
  readonly exports: Readonly<Record<string, string>>;
  /** Task map for the generated plugin package. */
  readonly tasks: Readonly<Record<string, string>>;
  /** Import map for the generated plugin package. */
  readonly imports: Readonly<Record<string, string>>;
  /** Compiler options for the generated plugin package. */
  readonly compilerOptions?: PluginDenoJsonCompilerOptions;
}

/** Compiler options emitted into a generated plugin `deno.json`. */
export interface PluginDenoJsonCompilerOptions {
  /** Runtime libraries available to generated plugin source files. */
  readonly lib?: readonly string[];
  /** Whether generated plugin TypeScript uses strict checking. */
  readonly strict?: boolean;
}

/**
 * Build the standard generated-plugin `deno.json` envelope.
 *
 * @param spec - Plugin-specific exports, tasks, and imports.
 * @param version - NetScript package version retained by the scaffold caller for signature parity.
 * @returns Pretty-printed `deno.json` text with a trailing newline.
 *
 * @example
 * ```ts
 * import { buildPluginDenoJson } from "@netscript/plugin/scaffold";
 *
 * const denoJson = buildPluginDenoJson({
 *   pluginName: "example",
 *   exports: { ".": "./mod.ts" },
 *   tasks: { check: "deno check mod.ts" },
 *   imports: { "@netscript/plugin": "jsr:@netscript/plugin@0.0.1-alpha.12" },
 * }, "0.0.1-alpha.12");
 * ```
 */
export function buildPluginDenoJson(
  spec: PluginDenoJsonSpec,
  version: string,
): string {
  void version;
  const config = {
    name: `@netscript-app/plugin-${spec.pluginName}`,
    version: '0.1.0',
    exports: spec.exports,
    tasks: spec.tasks,
    imports: spec.imports,
    compilerOptions: spec.compilerOptions ?? standardCompilerOptions(),
  };

  return `${JSON.stringify(config, null, 2)}\n`;
}

function standardCompilerOptions(): PluginDenoJsonCompilerOptions {
  return {
    lib: ['deno.ns', 'deno.unstable', 'dom', 'dom.iterable'],
    strict: true,
  };
}
