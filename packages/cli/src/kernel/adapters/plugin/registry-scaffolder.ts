/**
 * @module infra/plugin/registry-scaffolder
 *
 * Init-time plugins workspace scaffolding.
 */

import { join } from '@std/path';
import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import type { ScaffolderPort } from '../../ports/template-port.ts';
import type { ScaffoldResult } from '../../domain/core-types.ts';
import type { PluginRegistryScaffoldOptions } from '../../domain/plugin-kind.ts';
import { generatePluginsDenoJson } from '../../templates/workspace/plugins/deno-json.ts';
import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import { readTemplateAssetSync } from '../templates/template-asset.ts';

function adjustLocalBase(localBase: string, depth: number): string {
  return '../'.repeat(depth) + localBase;
}

/** Scaffolds the `plugins/` workspace used by `netscript init`. */
export class PluginRegistryScaffolder {
  /** Create a registry scaffolder with the shared scaffold writer. */
  constructor(private readonly scaffolder: ScaffolderPort) {}

  /** Scaffold the plugin workspace support files. */
  async scaffold(options: PluginRegistryScaffoldOptions): Promise<ScaffoldResult> {
    const start = performance.now();
    const filesCreated: string[] = [];
    const directoriesCreated: string[] = [];
    const filesSkipped: string[] = [];
    const pluginsRoot = join(options.targetPath, SCAFFOLD_DIRS.PLUGINS);

    await this.scaffolder.createDir(pluginsRoot);
    directoriesCreated.push(pluginsRoot);

    const denoJsonPath = join(pluginsRoot, SCAFFOLD_FILES.DENO_JSON);
    const denoJsonContent = generatePluginsDenoJson({
      packageName: `@${options.projectName}/plugins`,
      importMode: options.importMode,
      localBase: options.localBase ? adjustLocalBase(options.localBase, 1) : undefined,
    });

    if (await this.scaffolder.writeFile(denoJsonPath, denoJsonContent, options.force)) {
      filesCreated.push(denoJsonPath);
    } else {
      filesSkipped.push(denoJsonPath);
    }

    const pluginsModTemplate = readTemplateAssetSync(TEMPLATE_KEYS.workspacePluginsMod);
    const modPath = join(pluginsRoot, SCAFFOLD_FILES.MOD);
    if (await this.scaffolder.writeFile(modPath, pluginsModTemplate, options.force)) {
      filesCreated.push(modPath);
    } else {
      filesSkipped.push(modPath);
    }

    return {
      filesCreated,
      directoriesCreated,
      filesSkipped,
      totalOperations: filesCreated.length + directoriesCreated.length,
      durationMs: performance.now() - start,
    };
  }
}
