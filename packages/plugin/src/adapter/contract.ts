import type { DoctorReport } from '../cli/mod.ts';
import type { PluginCliArgs, PluginCliResult } from '../cli/types.ts';
import type { FileSystemPort } from '../ports/mod.ts';
import type { ScaffolderContext, ScaffoldResult } from '../protocol/mod.ts';
import type { ItemScaffolder } from './item/item-scaffolder.ts';

/** Primitive value accepted in plugin command configuration. */
export type PluginCommandValue = string | number | boolean | null;

/** Readonly command configuration supplied by the host. */
export type PluginCommandConfig = Readonly<Record<string, PluginCommandValue>>;

/**
 * Context shared by adapter command algorithms.
 *
 * @example
 * ```ts
 * const config: PluginCommandConfig = { enabled: true };
 * console.log(config.enabled);
 * ```
 */
export interface PluginCommandContext {
  /** Workspace root where generated artifacts are planned or written. */
  readonly workspaceRoot: string;
  /** Parsed plugin-specific options. */
  readonly options: Readonly<Record<string, unknown>>;
  /** Runtime configuration values visible to command seams. */
  readonly config: PluginCommandConfig;
  /** Whether command algorithms must avoid filesystem writes. */
  readonly dryRun: boolean;
  /** File-system port used by algorithms that write userland artifacts. */
  readonly fileSystem: FileSystemPort;
  /** Optional cancellation signal for async checks. */
  readonly signal?: AbortSignal;
}

/**
 * Starter resource emitted by the mandatory install command.
 *
 * @typeParam TInput Input passed to the resource's item scaffolder.
 *
 * @example
 * ```ts
 * const starter: InstallStarterResource<{ readonly name: string }> = {
 *   scaffolder: { name: 'job', emit: () => [] },
 *   input: { name: 'welcome' },
 * };
 * ```
 */
export interface InstallStarterResource<TInput = unknown> {
  /** Item scaffolder shared with future resource commands. */
  readonly scaffolder: ItemScaffolder<TInput>;
  /** Default input emitted during plugin install. */
  readonly input: TInput;
}

/**
 * Seam data consumed by the mandatory install algorithm.
 *
 * @example
 * ```ts
 * const install: InstallSpec = {
 *   dependencySpecifier: 'jsr:@example/plugin@^1',
 *   starterResources: [],
 * };
 * ```
 */
export interface InstallSpec {
  /** Dependency specifier expected in generated userland config. */
  readonly dependencySpecifier: string;
  /** Starter resources emitted by `install`. */
  readonly starterResources: readonly InstallStarterResource[];
  /** Optional runtime configuration keys the host should wire. */
  readonly configParams?: readonly string[];
  /** Optional Prisma or schema contract path contributed by the plugin. */
  readonly prismaContract?: string;
  /** Optional module path for generated host wiring. */
  readonly wiringEntry?: string;
}

/**
 * Extra doctor check supplied by a plugin seam.
 *
 * @example
 * ```ts
 * const check: DoctorCheckSpec = {
 *   name: 'config',
 *   run: () => ({ name: 'config', ok: true }),
 * };
 * ```
 */
export interface DoctorCheckSpec {
  /** Check name shown in the aggregate report. */
  readonly name: string;
  /**
   * Run the check.
   *
   * @param context Command context supplied by the runner.
   * @returns A doctor report check.
   */
  run(
    context: PluginCommandContext,
  ): DoctorReport['checks'][number] | Promise<DoctorReport['checks'][number]>;
}

/**
 * Seam data consumed by the mandatory doctor algorithm.
 *
 * @example
 * ```ts
 * const doctor: DoctorSpec = { requiredConfigKeys: ['DATABASE_URL'] };
 * console.log(doctor.requiredConfigKeys);
 * ```
 */
export interface DoctorSpec {
  /** Health endpoint documented by the plugin; defaults to `/health`. */
  readonly healthEndpoint?: string;
  /** Required runtime config keys checked by the core doctor algorithm. */
  readonly requiredConfigKeys?: readonly string[];
  /** Additional plugin-supplied checks appended to the core report. */
  readonly extraChecks?: readonly DoctorCheckSpec[];
}

/**
 * Static capability summary returned by the mandatory info command.
 *
 * @example
 * ```ts
 * const info: InfoSpec = { capabilities: ['jobs'], versionSource: 'manifest' };
 * console.log(info.capabilities.length);
 * ```
 */
export interface InfoSpec {
  /** Human-readable capabilities exposed by the plugin. */
  readonly capabilities?: readonly string[];
  /** Where the plugin version should be read from. */
  readonly versionSource?: 'manifest' | 'package' | 'static';
  /** Static version used when `versionSource` is `static`. */
  readonly version?: string;
}

/**
 * Seam data consumed by the mandatory update algorithm.
 *
 * @example
 * ```ts
 * const update: UpdateSpec = { strategy: 'dependency' };
 * console.log(update.strategy);
 * ```
 */
export interface UpdateSpec {
  /** Update strategy used by the core algorithm. */
  readonly strategy?: 'dependency' | 'none';
  /** Optional target dependency specifier. */
  readonly targetSpecifier?: string;
}

/**
 * Seam data consumed by the mandatory remove algorithm.
 *
 * @example
 * ```ts
 * const remove: RemoveSpec = { strategy: 'manifest-only' };
 * console.log(remove.strategy);
 * ```
 */
export interface RemoveSpec {
  /** Removal strategy used by the core algorithm. */
  readonly strategy?: 'manifest-only' | 'unsupported';
  /** Optional user-facing reason when removal is unsupported. */
  readonly reason?: string;
}

/**
 * Optional plugin-owned resource command.
 *
 * @typeParam TInput Input accepted by the resource scaffolder.
 *
 * @example
 * ```ts
 * const resource: PluginResource<{ readonly id: string }> = {
 *   name: 'job',
 *   scaffolder: { name: 'job', emit: () => [] },
 *   parseInput: (args) => ({ id: args.values?.[0] ?? 'sample' }),
 * };
 * ```
 */
export interface PluginResource<TInput = unknown> {
  /** Resource name used by `add <resource>` and `generate <resource>`. */
  readonly name: string;
  /** Unified item generator for this resource. */
  readonly scaffolder: ItemScaffolder<TInput>;
  /** Optional default input reused by install when listed as a starter. */
  readonly defaultInput?: TInput;
  /**
   * Parse CLI arguments into resource input.
   *
   * @param args CLI arguments supplied by the runner.
   * @returns Validated resource input.
   */
  parseInput?(args: PluginCliArgs): TInput | Promise<TInput>;
  /**
   * List known resource instances.
   *
   * @param context Command context supplied by the runner.
   * @returns Resource names.
   */
  list?(context: PluginCommandContext): readonly string[] | Promise<readonly string[]>;
  /**
   * Describe a resource instance.
   *
   * @param name Resource instance name.
   * @param context Command context supplied by the runner.
   * @returns Structured resource description.
   */
  describe?(name: string, context: PluginCommandContext): unknown | Promise<unknown>;
}

/**
 * Optional plugin-owned command handler.
 *
 * @example
 * ```ts
 * const command: PluginCommandSpec = {
 *   verb: 'logs',
 *   description: 'Show plugin logs.',
 *   run: () => ({ code: 0 }),
 * };
 * ```
 */
export interface PluginCommandSpec {
  /** Verb routed by the plugin adapter runner. */
  readonly verb: string;
  /** Short help text for the verb. */
  readonly description: string;
  /**
   * Run the plugin-owned command.
   *
   * @param args CLI arguments supplied by the runner.
   * @param context Command context supplied by the runner.
   * @returns CLI result.
   */
  run(
    args: PluginCliArgs,
    context: PluginCommandContext,
  ): PluginCliResult | Promise<PluginCliResult>;
}

/**
 * NetScript plugin adapter contract consumed by core command logic.
 *
 * @example
 * ```ts
 * const plugin: NetScriptPlugin = {
 *   name: '@example/plugin-workers',
 *   kind: 'workers',
 *   displayName: 'Workers',
 *   install: { dependencySpecifier: 'jsr:@example/plugin-workers@^1', starterResources: [] },
 * };
 * ```
 */
export interface NetScriptPlugin {
  /** Published plugin package name. */
  readonly name: string;
  /** Short plugin kind used in host command routing. */
  readonly kind: string;
  /** Human-readable display name. */
  readonly displayName: string;
  /** Mandatory install seams consumed by core logic. */
  readonly install: InstallSpec;
  /** Optional doctor seams consumed by core logic. */
  readonly doctor?: DoctorSpec;
  /** Optional info seams consumed by core logic. */
  readonly info?: InfoSpec;
  /** Optional update seams consumed by core logic. */
  readonly update?: UpdateSpec;
  /** Optional remove seams consumed by core logic. */
  readonly remove?: RemoveSpec;
  /** Optional resource commands implemented by the plugin. */
  readonly resources?: readonly PluginResource[];
  /** Optional extra command handlers implemented by the plugin. */
  readonly commands?: readonly PluginCommandSpec[];
}

/**
 * CLI entrypoint produced by `createPluginAdapter(plugin).toCli()`.
 *
 * @example
 * ```ts
 * const cli: PluginCliEntrypoint = async () => ({ code: 0 });
 * console.log((await cli({ command: 'info' })).code);
 * ```
 */
export type PluginCliEntrypoint = (args: PluginCliArgs) => Promise<PluginCliResult>;

/**
 * Adapter object produced by the plugin adapter factory.
 *
 * @example
 * ```ts
 * declare const adapter: PluginAdapter;
 * console.log(typeof adapter.toCli);
 * ```
 */
export interface PluginAdapter {
  /** Create a CLI entrypoint for plugin command execution. */
  toCli(): PluginCliEntrypoint;
  /** Create a scaffold entrypoint backed by the mandatory install command. */
  toScaffold(): (context: ScaffolderContext) => Promise<ScaffoldResult>;
}
