import { RemoteError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import type { ProcessPort } from '../../../../kernel/ports/process-port.ts';
import { EXIT_CODES } from '../host/plugin-loader.ts';
import type { PluginDispatchPort, PluginDispatchResult } from './plugin-dispatch-port.ts';

/** Framework-owned plugin verbs. */
export const FRAMEWORK_VERBS = [
  'add',
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

/** Return whether a value is one of the framework-owned plugin verbs. */
export function isFrameworkVerb(value: string): value is FrameworkVerb {
  return FRAMEWORK_VERBS.includes(value as FrameworkVerb);
}

/** Resolve the JSR CLI specifier for a plugin package. */
export function resolvePluginCliSpecifier(pkg: string): string {
  const spec = pkg.startsWith('jsr:') ? pkg : `jsr:${pkg}`;
  return spec.endsWith('/cli') ? spec : `${spec}/cli`;
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
