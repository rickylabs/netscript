/**
 * CLI adapter for loading project config under the project's own Deno config.
 */

import type { LoadConfigOptions, NetScriptConfig } from '@netscript/config';
import { join } from '@std/path';
import type { ProcessPort } from '../../ports/process-port.ts';

const CHILD_LOADER = new URL('./project-config-loader-child.ts', import.meta.url).href;

/** Options for loading a NetScript project config through the CLI adapter. */
export interface ProjectConfigLoaderOptions extends Pick<LoadConfigOptions, 'configFile'> {
  /** Project root directory whose `deno.json` owns import resolution. */
  readonly cwd: string;
}

/** Dependencies for the project-rooted config loader adapter. */
export interface ProjectConfigLoaderDependencies {
  /** Process execution adapter used to run the child Deno loader. */
  readonly process: ProcessPort;
  /** Deno executable name or path. */
  readonly denoCommand?: string;
  /** Child loader entrypoint, overridable for tests. */
  readonly loaderSpecifier?: string;
}

/** Create a config loader that resolves imports with the project's `deno.json`. */
export function createProjectConfigLoader(
  dependencies: ProjectConfigLoaderDependencies,
): (options: ProjectConfigLoaderOptions) => Promise<NetScriptConfig> {
  return async (options) => await loadProjectConfig(options, dependencies);
}

/** Load project config in a child Deno process rooted at the project `deno.json`. */
export async function loadProjectConfig(
  options: ProjectConfigLoaderOptions,
  dependencies: ProjectConfigLoaderDependencies,
): Promise<NetScriptConfig> {
  const args = [
    'run',
    '--allow-all',
    '--minimum-dependency-age=0',
  ];
  const denoConfigPath = join(options.cwd, 'deno.json');
  if (await fileExists(denoConfigPath)) {
    args.push('--config', denoConfigPath);
  }
  args.push(dependencies.loaderSpecifier ?? CHILD_LOADER, '--project-root', options.cwd);
  if (options.configFile) {
    args.push('--config-file', options.configFile);
  }

  const result = await dependencies.process.exec(
    dependencies.denoCommand ?? 'deno',
    args,
    {
      cwd: options.cwd,
    },
  );

  if (result.code !== 0) {
    throw new Error(formatChildFailure(result.stderr, result.stdout));
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse project config loader stdout: ${detail}`);
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    return (await Deno.stat(path)).isFile;
  } catch {
    return false;
  }
}

function formatChildFailure(stderr: string, stdout: string): string {
  const diagnostics = stderr.trim() || stdout.trim();
  return diagnostics
    ? `Project config loader failed: ${diagnostics}`
    : 'Project config loader failed with no diagnostics.';
}
