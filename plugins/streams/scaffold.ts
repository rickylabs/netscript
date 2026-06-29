/** Streams plugin adapter scaffold entrypoint.
 *
 * @module
 */

import { createPluginAdapter, type PluginScaffoldEntrypoint } from '@netscript/plugin/adapter';
import { streamsAdapterPlugin } from './src/adapter/plugin.ts';

/** Streams adapter scaffold entrypoint. */
const scaffold: PluginScaffoldEntrypoint = createPluginAdapter(streamsAdapterPlugin).toScaffold();

export default scaffold;
