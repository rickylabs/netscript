/** Auth plugin adapter scaffold entrypoint.
 *
 * @module
 */

import { createPluginAdapter, type PluginScaffoldEntrypoint } from '@netscript/plugin/adapter';
import { authAdapterPlugin } from './src/adapter/plugin.ts';

/** Auth adapter scaffold entrypoint. */
const scaffold: PluginScaffoldEntrypoint = createPluginAdapter(authAdapterPlugin).toScaffold();

export default scaffold;
