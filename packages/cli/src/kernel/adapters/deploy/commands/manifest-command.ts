/**
 * @module commands/deploy/manifest-command
 *
 * Manifest resolution helpers for deploy commands.
 */

import { exists } from '@std/fs';
import { join } from '@std/path';
import { DEPLOY_DIRS } from '../../../constants/runtime.ts';
import { resolveInstallDir } from '../../runtime/platform/deno-platform.ts';
import type { Manifest } from '../types.ts';

/**
 * Resolve and load the services.json manifest.
 */
export async function resolveManifest(
  options: { installDir?: string; deployDir?: string },
): Promise<{ manifest: Manifest; manifestDir: string; installDir: string }> {
  const searchPaths: { path: string; dir: string }[] = [];

  if (options.installDir) {
    searchPaths.push({
      path: join(options.installDir, DEPLOY_DIRS.CONFIG, 'services.json'),
      dir: options.installDir,
    });
    searchPaths.push({
      path: join(options.installDir, 'services.json'),
      dir: options.installDir,
    });
  }

  if (options.deployDir) {
    searchPaths.push({
      path: join(options.deployDir, DEPLOY_DIRS.CONFIG, 'services.json'),
      dir: options.deployDir,
    });
  }

  for (const candidate of searchPaths) {
    if (await exists(candidate.path)) {
      try {
        const content = await Deno.readTextFile(candidate.path);
        const manifest = JSON.parse(content) as Manifest;
        const effectiveInstallDir = options.installDir ?? resolveInstallDir(manifest.name);

        return {
          manifest,
          manifestDir: candidate.dir,
          installDir: effectiveInstallDir,
        };
      } catch {
        // Corrupted manifest; continue searching.
      }
    }
  }

  const searched = searchPaths.map((s) => s.path).join('\n    ');
  throw new Error(
    `services.json not found. Searched:\n    ${searched}\n\n` +
      `Run 'netscript deploy build' first, or specify --install-dir / --deploy-dir.`,
  );
}

/** Get ordered service names from the manifest. */
export function getServiceNames(
  manifest: Manifest,
  mode: 'start' | 'stop',
  singleService?: string,
): string[] {
  if (singleService) {
    if (!manifest.services[singleService]) {
      const available = Object.keys(manifest.services).join(', ');
      throw new Error(
        `Service "${singleService}" not found in manifest.\n` +
          `Available services: ${available}`,
      );
    }
    return [singleService];
  }

  const names = Object.keys(manifest.services);
  return mode === 'stop' ? [...names].reverse() : names;
}
