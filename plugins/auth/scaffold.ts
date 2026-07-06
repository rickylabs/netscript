/** Auth plugin adapter scaffold entrypoint.
 *
 * @module
 */

import {
  createPluginAdapter,
  type PluginScaffoldEntrypoint,
  runPluginScaffoldCli,
} from '@netscript/plugin/adapter';
import { authAdapterPlugin } from './src/adapter/plugin.ts';

export type {
  PluginLogger,
  PluginScaffoldEntrypoint,
  ScaffolderContext,
  ScaffoldResult,
} from '@netscript/plugin/adapter';

/** Auth adapter scaffold entrypoint. */
const scaffold: PluginScaffoldEntrypoint = createPluginAdapter(authAdapterPlugin).toScaffold();

export default scaffold;

if (import.meta.main) {
  await runPluginScaffoldCli(scaffold);
}
