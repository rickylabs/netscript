/** Shared Deno configuration values for a generated plugin scaffold. */
export interface PluginDenoJsonSpec {
  /** Kebab-case plugin directory name used in the generated package name. */
  readonly pluginName: string;
  /** Optional published package name override for first-party generated plugins. */
  readonly packageName?: string;
  /** Optional package version override. Defaults to the generated-app plugin version. */
  readonly packageVersion?: string;
  /** Optional package description. */
  readonly description?: string;
  /** Optional package license expression. */
  readonly license?: string;
  /** Export map for the generated plugin package. */
  readonly exports: Readonly<Record<string, string>>;
  /** Task map for the generated plugin package. */
  readonly tasks: Readonly<Record<string, string>>;
  /** Import map for the generated plugin package. */
  readonly imports: Readonly<Record<string, string>>;
  /** Publish file filters for the generated plugin package. */
  readonly publish?: PluginDenoJsonPublish;
  /** Compiler options for the generated plugin package. */
  readonly compilerOptions?: PluginDenoJsonCompilerOptions;
}

/** Publish include and exclude filters emitted into a generated plugin `deno.json`. */
export interface PluginDenoJsonPublish {
  /** Files and globs included in the package publish surface. */
  readonly include?: readonly string[];
  /** Files and globs excluded from the package publish surface. */
  readonly exclude?: readonly string[];
}

/** Compiler options emitted into a generated plugin `deno.json`. */
export interface PluginDenoJsonCompilerOptions {
  /** Runtime libraries available to generated plugin source files. */
  readonly lib?: readonly string[];
  /** Whether generated plugin TypeScript uses strict checking. */
  readonly strict?: boolean;
  /** Whether generated plugin TypeScript rejects implicit `any`. */
  readonly noImplicitAny?: boolean;
  /** Whether generated plugin TypeScript applies strict null checks. */
  readonly strictNullChecks?: boolean;
}

/**
 * Build the standard generated-plugin `deno.json` envelope from plugin-specific data.
 *
 * @param spec - Plugin-specific metadata, exports, tasks, imports, and publish filters.
 * @param version - NetScript package version used when the spec does not override package version.
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
  return `${JSON.stringify(buildPluginDenoJsonObject(spec), null, 2)}\n`;
}

function buildPluginDenoJsonObject(spec: PluginDenoJsonSpec): Readonly<Record<string, unknown>> {
  const base = {
    name: spec.packageName ?? `@netscript-app/plugin-${spec.pluginName}`,
    version: spec.packageVersion ?? '0.1.0',
  };

  const compilerOptions = spec.compilerOptions ?? standardCompilerOptions();
  const hasPackageMetadata = spec.description !== undefined || spec.license !== undefined ||
    spec.packageName !== undefined || spec.packageVersion !== undefined ||
    spec.publish !== undefined;

  if (hasPackageMetadata) {
    return {
      ...base,
      ...(spec.description === undefined ? {} : { description: spec.description }),
      ...(spec.license === undefined ? {} : { license: spec.license }),
      exports: spec.exports,
      imports: spec.imports,
      tasks: spec.tasks,
      ...(spec.publish === undefined ? {} : { publish: spec.publish }),
      compilerOptions,
    };
  }

  return {
    ...base,
    exports: spec.exports,
    tasks: spec.tasks,
    imports: spec.imports,
    compilerOptions,
  };
}

function standardCompilerOptions(): PluginDenoJsonCompilerOptions {
  return {
    lib: ['deno.ns', 'deno.unstable', 'dom', 'dom.iterable'],
    strict: true,
  };
}
