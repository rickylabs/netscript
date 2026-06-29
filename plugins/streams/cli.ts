/** Streams plugin adapter CLI entrypoint.
 *
 * @module
 */

import { createPluginAdapter, type PluginCliEntrypoint } from '@netscript/plugin/adapter';
import { streamsAdapterPlugin } from './src/adapter/plugin.ts';

/** Streams adapter CLI entrypoint. */
const cli: PluginCliEntrypoint = createPluginAdapter(streamsAdapterPlugin).toCli();

export default cli;
