import { basename, join } from '@std/path';
import { readConfiguredPluginDirectories } from '../../../../kernel/adapters/plugin/installed-plugin-declarations.ts';
import { SCAFFOLD_DIRS } from '../../../../kernel/constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../../../kernel/constants/scaffold/scaffold-files.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { PluginInstallRequest } from '../../../domain/plugin-install-plan.ts';

/** Resolve consumer apps before scaffolding, preserving headless installations. */
export async function resolvePluginAppReferences(
  request:
    & Pick<PluginInstallRequest, 'projectRoot' | 'app'>
    & Partial<Pick<PluginInstallRequest, 'pluginName' | 'overwrite'>>,
  fs: FileSystemPort,
  declaredConsumers?: readonly string[],
): Promise<readonly string[]> {
  const path = join(request.projectRoot, SCAFFOLD_FILES.APPSETTINGS);
  const settings: { NetScript?: { Apps?: Record<string, { Enabled?: boolean; Type?: string }> } } =
    await fs.exists(path) ? JSON.parse(await fs.readFile(path)) : {};
  const apps = Object.entries(settings.NetScript?.Apps ?? {}).filter(([, entry]) =>
    entry.Enabled !== false && (entry.Type ?? 'app') === 'app'
  ).map(([name]) => name).sort();
  if (request.app !== undefined && !apps.includes(request.app)) {
    throw new ScaffoldValidationError(
      `--app "${request.app}" must name an enabled web application in NetScript.Apps.`,
    );
  }
  if (request.app !== undefined) return [request.app];
  if (request.overwrite && request.pluginName) {
    const configured = await readConfiguredPluginDirectories(request.projectRoot, fs);
    const directories = [
      ...configured.filter((directory) => basename(directory) === request.pluginName),
      join(request.projectRoot, request.pluginName),
      join(request.projectRoot, SCAFFOLD_DIRS.PLUGINS, request.pluginName),
    ];
    for (const directory of new Set(directories)) {
      const manifestPath = join(directory, 'scaffold.plugin.json');
      if (!await fs.exists(manifestPath)) continue;
      const manifest: { linking?: { consumers?: { apps?: unknown } } } = JSON.parse(
        await fs.readFile(manifestPath),
      );
      const consumers = manifest.linking?.consumers?.apps;
      if (
        Array.isArray(consumers) &&
        consumers.every((value): value is string => typeof value === 'string')
      ) {
        return consumers;
      }
    }
  }
  return declaredConsumers ?? apps;
}
