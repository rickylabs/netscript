/**
 * Public API for the NetScript CLI package.
 *
 * The root surface exposes the embeddable public CLI plus the plugin-platform
 * host and dispatch contracts used by integration hosts. Maintainer flows,
 * scaffold internals, adapters, and broad kernel registries stay on internal
 * paths or dedicated subpaths.
 *
 * @module
 */

import type { PublicCliCommand } from './composition/create-public-cli.ts';
import {
  createPluginHostLoader as createInternalPluginHostLoader,
  type PluginHostLoaderOptions as InternalPluginHostLoaderOptions,
  type PluginHostLoaderPort as InternalPluginHostLoaderPort,
} from './features/plugins/host/plugin-loader.ts';
import {
  dispatchPluginVerb as dispatchInternalPluginVerb,
  FRAMEWORK_VERBS as INTERNAL_FRAMEWORK_VERBS,
  isFrameworkVerb as isInternalFrameworkVerb,
  resolvePluginCliSpecifier,
} from './features/plugins/dispatch/dispatch-plugin-verb.ts';
import type { FrameworkVerb as InternalFrameworkVerb } from './features/plugins/dispatch/dispatch-plugin-verb.ts';
import {
  resolvePluginManifest as resolveInternalPluginManifest,
  type ResolvePluginManifestOptions as InternalResolvePluginManifestOptions,
} from './features/plugins/host/resolve-plugin-manifest.ts';
import {
  type PluginScaffoldDependencies as InternalPluginScaffoldDependencies,
  type PluginScaffoldOptions as InternalPluginScaffoldOptions,
  scaffoldPluginPackage as scaffoldInternalPluginPackage,
} from './features/plugins/scaffold/scaffold-plugin-use-case.ts';

/**
 * Creates the public NetScript CLI command tree.
 */
export { createPublicCli } from './composition/create-public-cli.ts';

/**
 * Host contract required by `createPublicCli`.
 */
export type { PublicCliHost } from './composition/create-public-cli.ts';

/**
 * Public command tree returned by `createPublicCli`.
 */
export type { PublicCliCommand } from './composition/create-public-cli.ts';

/**
 * Runs the public CLI with standard NetScript error formatting.
 */
export { runPublicCli } from './composition/run-public-cli.ts';

/**
 * Runtime contract required by `runPublicCli`.
 */
export type { PublicCliRuntime } from './composition/run-public-cli.ts';

/**
 * Plugin host loader factory.
 */
/** Plugin manifest value returned by public host loader contracts. */
export interface PluginHostManifest {
  /** Plugin package name. */
  readonly name: string;
  /** Plugin semantic version. */
  readonly version: string;
  /** Optional human-readable description. */
  readonly description?: string;
  /** Runtime contribution payload owned by the plugin package. */
  readonly contributions?: unknown;
  /** Additional plugin manifest fields preserved for host integrations. */
  readonly [key: string]: unknown;
}

/**
 * Plugin host loader contracts.
 */
export interface PluginHostLoaderOptions {
  /** Project root for configuration and walker operations. */
  readonly projectRoot: string;
  /** Config loader for `netscript.config.ts`. */
  readonly configLoader: {
    /** Load project configuration for the supplied root. */
    load(projectRoot: string): Promise<Readonly<Record<string, unknown>>>;
  };
  /** Manifest resolver used for configured plugin specs. */
  readonly manifestResolver: {
    /** Resolve a plugin manifest by package spec or root. */
    resolve(spec: string): Promise<PluginHostManifest | undefined>;
  };
  /** Walker used to discover plugin source files. */
  readonly walker: {
    /** Walk the supplied project root. */
    walk(root: string): Promise<readonly unknown[]>;
  };
  /** Extractor used to read contributions from walked files. */
  readonly extractor: {
    /** Extract contribution candidates from walked files. */
    extract(files: readonly unknown[]): Promise<readonly unknown[]>;
  };
  /** Emitter used by the walker pipeline. */
  readonly emitter: {
    /** Emit registry output for extracted contributions. */
    emit(contributions: readonly unknown[]): Promise<unknown>;
  };
  /** Filesystem adapter reserved for host-side template expansion. */
  readonly fs: unknown;
}

/** Resolved plugin host state. */
export interface PluginHostState {
  /** Loaded project configuration. */
  readonly config: Readonly<Record<string, unknown>>;
  /** Resolved plugin manifests. */
  readonly plugins: readonly PluginHostManifest[];
  /** Merged contribution payload. */
  readonly contributions: unknown;
  /** Registry emissions produced by the walker. */
  readonly emissions: readonly unknown[];
}

/** Public host loader port. */
export interface PluginHostLoaderPort {
  /** Resolve the current plugin host state. */
  resolve(): Promise<PluginHostState>;
}

/** Create a plugin host loader from structural public ports. */
export function createPluginHostLoader(
  options: PluginHostLoaderOptions,
): PluginHostLoaderPort {
  return createInternalPluginHostLoader(
    options as unknown as InternalPluginHostLoaderOptions, // quality-allow: compatibility boundary between independently resolved upstream generic types
  ) as unknown as InternalPluginHostLoaderPort as unknown as PluginHostLoaderPort; // quality-allow: compatibility boundary between independently resolved upstream generic types
}

/**
 * Manifest resolver wrapper for plugin host flows.
 */
/** Options for resolving a plugin manifest. */
export interface ResolvePluginManifestOptions {
  /** Manifest resolver used to resolve the package spec. */
  readonly manifestResolver: {
    /** Resolve a plugin manifest by package spec. */
    resolve(spec: string): Promise<PluginHostManifest | undefined>;
  };
}

/** Resolve a plugin manifest by package spec. */
export function resolvePluginManifest(
  spec: string,
  options: ResolvePluginManifestOptions,
): Promise<PluginHostManifest> {
  return resolveInternalPluginManifest(
    spec,
    options as unknown as InternalResolvePluginManifestOptions, // quality-allow: compatibility boundary between independently resolved upstream generic types
  ) as Promise<PluginHostManifest>;
}

/**
 * Framework plugin verb dispatch.
 */
export { resolvePluginCliSpecifier };

/** Framework-owned plugin verbs. */
export type FrameworkVerb =
  | 'install'
  | 'remove'
  | 'enable'
  | 'disable'
  | 'sync'
  | 'setup'
  | 'update'
  | 'doctor'
  | 'info';

/** Framework-owned plugin verb constants. */
export const FRAMEWORK_VERBS: readonly FrameworkVerb[] = INTERNAL_FRAMEWORK_VERBS;

/** Return whether a value is a framework-owned plugin verb. */
export function isFrameworkVerb(value: string): value is FrameworkVerb {
  return isInternalFrameworkVerb(value);
}

/** Result of a public process dispatch. */
export interface PluginDispatchProcessResult {
  /** Process exit code. */
  readonly code: number;
  /** Captured standard output. */
  readonly stdout: string;
  /** Captured standard error. */
  readonly stderr: string;
}

/** Options for dispatching a plugin verb. */
export interface DispatchPluginVerbOptions {
  /** Project root used as the subprocess working directory. */
  readonly projectRoot: string;
  /** Process runner used to invoke Deno. */
  readonly processRunner: {
    /** Execute one process. */
    exec(
      command: string,
      args: readonly string[],
      options?: { readonly cwd?: string; readonly env?: Readonly<Record<string, string>> },
    ): Promise<PluginDispatchProcessResult>;
  };
}

/** Dispatch a framework plugin verb through `deno x -A jsr:<pkg>/cli`. */
export function dispatchPluginVerb(
  verb: FrameworkVerb,
  pkg: string,
  args: readonly string[],
  options: DispatchPluginVerbOptions,
): Promise<PluginDispatchProcessResult> {
  return dispatchInternalPluginVerb(
    verb as InternalFrameworkVerb,
    pkg,
    args,
    options,
  );
}

/**
 * Plugin package scaffold use case.
 */
/** Options for scaffolding a plugin package. */
export interface PluginScaffoldOptions {
  /** Full plugin package name, for example `@acme/plugin-billing`. */
  readonly pluginName: string;
  /** Directory that receives generated files. */
  readonly targetPath: string;
  /** Optional template path registry. */
  readonly templateRegistry?: readonly string[];
  /** Optional embedded template content keyed by registry path. */
  readonly templateContent?: Readonly<Record<string, string>>;
  /** Whether existing files may be overwritten. */
  readonly overwrite?: boolean;
}

/** Result returned after plugin package scaffolding. */
export interface PluginScaffoldResult {
  /** Files written by the scaffold use case. */
  readonly filesCreated: readonly string[];
  /** Directories created by the scaffold use case. */
  readonly directoriesCreated: readonly string[];
  /** Files skipped because overwrite was disabled. */
  readonly filesSkipped: readonly string[];
}

/** Dependencies for plugin package scaffolding. */
export interface PluginScaffoldDependencies {
  /** Filesystem adapter used by the scaffold use case. */
  readonly fs: {
    /** Read a UTF-8 file. */
    readFile(path: string): Promise<string>;
    /** Write a UTF-8 file. */
    writeFile(path: string, content: string): Promise<void>;
    /** Return whether a path exists. */
    exists(path: string): Promise<boolean>;
    /** Create a directory and parents. */
    createDir(path: string): Promise<void>;
  };
}

/** Scaffold a plugin package from skeleton templates. */
export function scaffoldPluginPackage(
  options: PluginScaffoldOptions,
  dependencies: PluginScaffoldDependencies,
): Promise<PluginScaffoldResult> {
  return scaffoldInternalPluginPackage(
    options as unknown as InternalPluginScaffoldOptions, // quality-allow: compatibility boundary between independently resolved upstream generic types
    dependencies as unknown as InternalPluginScaffoldDependencies, // quality-allow: compatibility boundary between independently resolved upstream generic types
  ) as Promise<PluginScaffoldResult>;
}

/** Target accepted by `inspectCli`. */
export interface CliInspectionTarget {
  /** Optional command tree to inspect. */
  readonly command?: PublicCliCommand;
}

/** Diagnostic summary for an embeddable CLI target. */
export interface CliInspectionReport {
  /** Human-readable diagnostic summary. */
  readonly summary: string;
  /** Whether the target exposes a parse function. */
  readonly hasParse: boolean;
}

/**
 * Inspect an embeddable CLI target for diagnostics.
 */
export function inspectCli(target: CliInspectionTarget = {}): CliInspectionReport {
  const hasParse = typeof target.command?.parse === 'function';
  return {
    summary: hasParse ? 'Public CLI command tree is parseable.' : 'No CLI command tree supplied.',
    hasParse,
  };
}
