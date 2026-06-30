import { RemoteError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import type { ProcessPort } from '../../../../kernel/ports/process-port.ts';
import type { ScaffoldResult } from '@netscript/plugin/protocol';
import { EXIT_CODES } from '../host/plugin-loader.ts';
import type { ValidatedPluginDescriptor } from '../install/jsr-plugin-validator-port.ts';
import {
  type JsrPackageFileFetcher,
  verifyJsrPackageIntegrity,
} from '../../../infra/jsr/verify-jsr-package-integrity.ts';
import type { PluginDispatchPort, PluginDispatchResult } from './plugin-dispatch-port.ts';

/** Framework-owned plugin verbs. */
export const FRAMEWORK_VERBS = [
  'install',
  'remove',
  'enable',
  'disable',
  'sync',
  'setup',
  'update',
  'doctor',
  'info',
] as const;

/** Framework-owned plugin verb. */
export type FrameworkVerb = typeof FRAMEWORK_VERBS[number];

/** Options for dispatching a framework verb to a plugin CLI. */
export interface DispatchPluginVerbOptions {
  /** Project root used as the subprocess working directory. */
  readonly projectRoot: string;
  /** Process execution port. */
  readonly processRunner: ProcessPort;
}

/** Source used for plugin-owned scaffold execution. */
export type PluginScaffoldDispatchSource =
  | { readonly kind: 'jsr'; readonly specifier: string }
  | { readonly kind: 'local-path'; readonly path: string };

/** Options for dispatching the plugin-owned scaffold entrypoint. */
export interface DispatchPluginScaffoldOptions {
  /** Statically validated plugin descriptor. */
  readonly descriptor: ValidatedPluginDescriptor;
  /** Source selected by `--jsr-url` or `--local-path`. */
  readonly source: PluginScaffoldDispatchSource;
  /** Target workspace root. */
  readonly projectRoot: string;
  /** Local plugin config/workspace name. */
  readonly pluginName: string;
  /** Whether the child scaffolder must preview changes only. */
  readonly dryRun: boolean;
  /** Deno permission flags from the S3 flag builder. */
  readonly permissionFlags: readonly string[];
  /** Additional arguments forwarded after the context payload. */
  readonly scaffoldArgs?: readonly string[];
  /** Process execution port. */
  readonly processRunner: ProcessPort;
  /** Optional JSR file fetcher used by integrity verification. */
  readonly fileFetcher?: JsrPackageFileFetcher;
}

/** Return whether a value is one of the framework-owned plugin verbs. */
export function isFrameworkVerb(value: string): value is FrameworkVerb {
  return FRAMEWORK_VERBS.includes(value as FrameworkVerb);
}

/** Resolve the JSR CLI specifier for a plugin package. */
export function resolvePluginCliSpecifier(pkg: string): string {
  const spec = pkg.startsWith('jsr:') ? pkg : `jsr:${pkg}`;
  return spec.endsWith('/cli') ? spec : `${spec}/cli`;
}

/** Resolve the executable scaffold target for a package or local plugin directory. */
export function resolvePluginScaffoldTarget(
  source: PluginScaffoldDispatchSource,
  exportPath: string,
): string {
  const suffix = exportPath.startsWith('./') ? exportPath.slice(2) : exportPath;
  if (source.kind === 'jsr') {
    const spec = source.specifier.startsWith('jsr:') ? source.specifier : `jsr:${source.specifier}`;
    return `${spec}/${suffix}`;
  }
  const localSuffix = suffix.endsWith('.ts') ? suffix : `${suffix}.ts`;
  return `${source.path.replace(/\/+$/, '')}/${localSuffix}`;
}

/** Dispatch a framework plugin verb through `deno x -A jsr:<pkg>/cli`. */
export async function dispatchPluginVerb(
  verb: FrameworkVerb,
  pkg: string,
  args: readonly string[],
  options: DispatchPluginVerbOptions,
): Promise<PluginDispatchResult> {
  const result = await options.processRunner.exec(
    'deno',
    ['x', '-A', resolvePluginCliSpecifier(pkg), verb, ...args],
    { cwd: options.projectRoot },
  );

  if (result.code !== EXIT_CODES.SUCCESS) {
    throw new RemoteError(
      EXIT_CODES.DISPATCH_FAILED,
      `Plugin command failed: ${verb} ${pkg}`,
      { context: { verb, pkg, code: result.code, stderr: result.stderr } },
    );
  }

  return result;
}

/** Dispatch a plugin-owned scaffold entrypoint and parse its JSON result. */
export async function dispatchPluginScaffold(
  options: DispatchPluginScaffoldOptions,
): Promise<ScaffoldResult> {
  if (options.source.kind === 'jsr') {
    const integrity = await verifyJsrPackageIntegrity(options.descriptor, options.fileFetcher);
    if (!integrity.ok) {
      throw new RemoteError(
        EXIT_CODES.DISPATCH_FAILED,
        `Plugin package integrity check failed for ${options.descriptor.package.packageSpecifier}.`,
        { context: integrity },
      );
    }
  }

  const scaffoldResult = await runScaffoldEntrypoint(options);
  if (scaffoldResult.status === 'failed') {
    throw new RemoteError(
      EXIT_CODES.DISPATCH_FAILED,
      `Plugin scaffold failed: ${options.descriptor.package.packageSpecifier}`,
      { context: { status: scaffoldResult.status } },
    );
  }

  if (options.dryRun) {
    return scaffoldResult;
  }

  for (const postScript of options.descriptor.manifest.postScripts ?? []) {
    const result = await options.processRunner.exec(
      'deno',
      buildScriptArgs(
        options.source,
        postScript.export,
        options.permissionFlags,
        postScript.args ?? [],
      ),
      { cwd: options.projectRoot },
    );
    if (result.code !== EXIT_CODES.SUCCESS) {
      throw new RemoteError(
        EXIT_CODES.DISPATCH_FAILED,
        `Plugin post-script failed: ${postScript.export}`,
        { context: { postScript: postScript.export, code: result.code, stderr: result.stderr } },
      );
    }
  }

  return scaffoldResult;
}

/** Create a dispatch port backed by the supplied process runner. */
export function createPluginDispatchPort(processRunner: ProcessPort): PluginDispatchPort {
  return {
    dispatch: async (options) => {
      return await dispatchPluginVerb(options.verb, options.pkg, options.args, {
        projectRoot: options.projectRoot,
        processRunner,
      });
    },
  };
}

async function runScaffoldEntrypoint(
  options: DispatchPluginScaffoldOptions,
): Promise<ScaffoldResult> {
  const result = await options.processRunner.exec(
    'deno',
    buildScriptArgs(
      options.source,
      options.descriptor.manifest.scaffolder.export,
      options.permissionFlags,
      [
        '--context-json',
        JSON.stringify({
          workspaceRoot: options.projectRoot,
          options: { pluginName: options.pluginName },
          dryRun: options.dryRun,
        }),
        ...(options.scaffoldArgs ?? []),
      ],
    ),
    { cwd: options.projectRoot },
  );
  if (result.code !== EXIT_CODES.SUCCESS) {
    throw new RemoteError(
      EXIT_CODES.DISPATCH_FAILED,
      `Plugin scaffold command failed: ${options.descriptor.package.packageSpecifier}`,
      { context: { code: result.code, stderr: result.stderr } },
    );
  }

  return parseScaffoldResult(result.stdout);
}

function buildScriptArgs(
  source: PluginScaffoldDispatchSource,
  exportPath: string,
  permissionFlags: readonly string[],
  args: readonly string[],
): readonly string[] {
  const target = resolvePluginScaffoldTarget(source, exportPath);
  return ['run', ...permissionFlags, target, ...args];
}

function parseScaffoldResult(stdout: string): ScaffoldResult {
  const lines = stdout.trim().split(/\r?\n/).filter((line) => line.trim().length > 0);
  const json = lines.at(-1);
  if (json === undefined) {
    throw new RemoteError(EXIT_CODES.DISPATCH_FAILED, 'Plugin scaffold returned no JSON result.');
  }
  const value: unknown = JSON.parse(json);
  if (!isScaffoldResult(value)) {
    throw new RemoteError(EXIT_CODES.DISPATCH_FAILED, 'Plugin scaffold returned invalid JSON.');
  }
  return value;
}

function isScaffoldResult(value: unknown): value is ScaffoldResult {
  if (value === null || typeof value !== 'object') return false;
  if (!('status' in value) || !('createdFiles' in value) || !('modifiedFiles' in value)) {
    return false;
  }
  if (!('databaseMigrationsAdded' in value)) return false;
  const status = value.status;
  return (
    (status === 'applied' || status === 'planned' || status === 'skipped' || status === 'failed') &&
    Array.isArray(value.createdFiles) &&
    Array.isArray(value.modifiedFiles) &&
    typeof value.databaseMigrationsAdded === 'boolean'
  );
}
