/**
 * Workers Describe Router
 *
 * Implements the mandatory base seam `describe` route every NetScript feature
 * plugin carries. Returns a typed, marketplace-discoverable
 * {@link PluginCapabilities} document describing the workers plugin's surface.
 *
 * Every field is derived from workers ground truth (the plugin manifest, the v1
 * contract route groups, and the plugin type), not guessed.
 */

import type { PluginCapabilities } from '@netscript/plugin/contract-base';
import { router, type WorkersHandlers } from './router-context.ts';

/**
 * Capabilities document advertised by the running workers service.
 *
 * - `pluginName` — the published plugin package name (`workersPlugin.name`).
 * - `contractVersions` — the contract versions served (`v1`, per the manifest's
 *   `contributions.contractVersions`).
 * - `routeGroups` — the resource groups exposed by the v1 contract (jobs,
 *   executions, tasks, task-executions, topics, subscribe, admin).
 * - `capabilities` — the plugin's advertised capability tags, grounded in the
 *   manifest `type` (`background-processor`) and the contract surface.
 */
const workersCapabilities: PluginCapabilities = {
  pluginName: '@netscript/plugin-workers',
  contractVersions: ['v1'],
  routeGroups: [
    'jobs',
    'executions',
    'tasks',
    'task-executions',
    'topics',
    'subscribe',
    'admin',
  ],
  capabilities: [
    'background-processor',
    'job-scheduling',
    'task-execution',
    'sse-streaming',
  ],
};

/** Handler for the mandatory base seam `describe` route. */
export const describeHandlers: WorkersHandlers<'describe'> = {
  describe: router.describe.handler(() => workersCapabilities),
};
