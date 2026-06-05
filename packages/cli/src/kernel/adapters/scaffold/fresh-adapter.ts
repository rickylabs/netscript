/**
 * @module infra/scaffold/fresh-adapter
 *
 * Wraps the `@fresh/init` subprocess to scaffold a Fresh app, then
 * normalizes the output for NetScript conventions.
 *
 * If the subprocess fails (no network, version mismatch, CI environment),
 * falls back to a minimal template-based app scaffold.
 */

import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type { ScaffoldResult } from '../../domain/core-types.ts';
import type { PackageSourceMode } from '../../domain/scaffold/scaffold-options.ts';

// ============================================================================
// TYPES
// ============================================================================

/** Options for the Fresh init adapter. */
export interface FreshInitOptions {
  /** Absolute path to the target directory for the Fresh app (e.g., /abs/apps/dashboard/). */
  readonly targetDir: string;
  /** Project name for scoped package naming. */
  readonly projectName: string;
  /** App name (e.g., 'dashboard'). */
  readonly appName: string;
  /** Import mode for NetScript package references. */
  readonly importMode: PackageSourceMode;
  /** Local base path for workspace-source mode. */
  readonly localBase?: string;
  /** Whether to skip the subprocess and use fallback directly. */
  readonly skipSubprocess?: boolean;
}

/** Result of the Fresh init operation. */
export interface FreshInitResult {
  /** Whether @fresh/init subprocess succeeded. */
  readonly freshInitSuccess: boolean;
  /** Whether we fell back to template-based scaffolding. */
  readonly usedFallback: boolean;
  /** Standard scaffold result. */
  readonly scaffoldResult: ScaffoldResult;
}

// ============================================================================
// KNOWN DEMO FILES
// ============================================================================

/**
 * Files that @fresh/init may create that we want to remove during normalization.
 * We check existence before deleting — Fresh may change these between versions.
 */
const KNOWN_DEMO_FILES: readonly string[] = [
  'components/Button.tsx',
  'islands/Counter.tsx',
  'routes/api/joke.ts',
  'static/logo.svg',
];

// ============================================================================
// FRESH ADAPTER
// ============================================================================

/**
 * Attempt to run `@fresh/init` as a subprocess.
 *
 * @param targetDir - Absolute path for the Fresh app directory.
 * @returns `true` if the subprocess succeeded, `false` otherwise.
 */
export async function runFreshInit(targetDir: string): Promise<boolean> {
  try {
    const cmd = new Deno.Command('deno', {
      args: [
        'run',
        '-Ar',
        'jsr:@fresh/init',
        targetDir,
        '--force',
        '--docker=false',
        '--tailwind=false',
        '--vscode=false',
      ],
      // Close stdin to prevent interactive prompts from hanging.
      stdin: 'null',
      // Pipe stdout/stderr so scaffold output doesn't pollute the CLI's
      // own progress display. Failures are detected via exit code.
      stdout: 'piped',
      stderr: 'piped',
    });
    const result = await cmd.output();
    return result.success;
  } catch {
    // deno not found, permission denied, etc.
    return false;
  }
}

/**
 * Normalize a Fresh-scaffolded directory for NetScript conventions.
 *
 * - Removes known demo files
 * - Updates `deno.json` with scoped name and exports
 *
 * @param targetDir - Absolute path to the Fresh app directory.
 * @param fs - Filesystem adapter for reading/writing.
 * @param projectName - Project name for scoped package naming.
 * @param appName - App name (e.g., 'dashboard').
 * @returns List of files removed during normalization.
 */
export async function normalizeFreshOutput(
  targetDir: string,
  fs: FileSystemPort,
  projectName: string,
  appName: string,
): Promise<string[]> {
  const removed: string[] = [];

  // Remove known demo files
  for (const demoFile of KNOWN_DEMO_FILES) {
    const fullPath = `${targetDir}/${demoFile}`;
    if (await fs.exists(fullPath)) {
      await fs.remove(fullPath);
      removed.push(fullPath);
    }
  }

  // Update deno.json with scoped name, Vite tasks, and plugin imports
  const denoJsonPath = `${targetDir}/deno.json`;
  if (await fs.exists(denoJsonPath)) {
    try {
      const content = await fs.readFile(denoJsonPath);
      const config = JSON.parse(content);
      config.name = `@${projectName}/${appName}`;
      config.exports = './main.ts';

      // Replace @fresh/init tasks with Vite-based workflow
      config.tasks = {
        dev: 'deno run -A npm:vite --configLoader native',
        build: 'deno run -A npm:vite build',
        serve: 'deno run -A npm:vite preview',
      };

      // Ensure Vite and Fresh plugin imports exist
      config.imports ??= {};
      config.imports['@fresh/plugin-vite'] ??= 'jsr:@fresh/plugin-vite@^1.0.8';
      config.imports['vite'] ??= 'npm:vite@^7.2.2';

      await fs.writeFile(denoJsonPath, JSON.stringify(config, null, 2) + '\n');
    } catch {
      // If we can't parse the existing deno.json, leave it as-is.
      // The fallback templates will handle it.
    }
  }

  return removed;
}
