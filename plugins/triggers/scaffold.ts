/** Triggers plugin adapter scaffold entrypoint.
 *
 * @module
 */

import { createPluginAdapter, type PluginScaffoldEntrypoint } from '@netscript/plugin/adapter';
import { triggersAdapterPlugin } from './src/adapter/plugin.ts';

/** Triggers adapter scaffold entrypoint. */
const scaffold: PluginScaffoldEntrypoint = createPluginAdapter(triggersAdapterPlugin).toScaffold();

export default scaffold;
