/**
 * @module maintainer/infra/official-plugin-copier
 *
 * Adapter that exposes the official plugin copy use case through the
 * sync-plugin port shape used by the maintainer composition root.
 */

import { copyOfficialPlugin } from '../features/sync/plugin/copy-official-plugin.ts';
import type { SyncPluginDependencies } from '../features/sync/plugin/sync-plugin.ts';

/** Create the maintainer sync-plugin copy adapter. */
export function createOfficialPluginCopier(): SyncPluginDependencies['copyPlugin'] {
  return async (request) => {
    const result = await copyOfficialPlugin(request);
    return {
      pluginName: result.pluginName,
      pluginDir: result.pluginDir,
      backgroundDir: result.backgroundDir,
      serviceConfigKey: result.serviceConfigKey,
      servicePort: result.servicePort,
      backgroundPort: result.backgroundPort,
      workspaceMembers: result.workspaceMembers,
      filesCreated: result.scaffoldResult.filesCreated,
      directoriesCreated: result.scaffoldResult.directoriesCreated,
    };
  };
}
