/** AI plugin adapter CLI entrypoint.
 *
 * @module
 */

import { createPluginAdapter, type PluginCliEntrypoint } from '@netscript/plugin/adapter';
import { aiAdapterPlugin } from './src/adapter/plugin.ts';

export type { PluginCliEntrypoint } from '@netscript/plugin/adapter';

/** AI adapter CLI entrypoint. */
const cli: PluginCliEntrypoint = createPluginAdapter(aiAdapterPlugin).toCli();

export default cli;
