/** Auth plugin adapter CLI entrypoint.
 *
 * @module
 */

import { createPluginAdapter, type PluginCliEntrypoint } from '@netscript/plugin/adapter';
import { authAdapterPlugin } from './src/adapter/plugin.ts';

export type {
  PluginCliArgs,
  PluginCliEntrypoint,
  PluginCliResult,
} from '@netscript/plugin/adapter';

/** Auth adapter CLI entrypoint. */
const cli: PluginCliEntrypoint = createPluginAdapter(authAdapterPlugin).toCli();

export default cli;
