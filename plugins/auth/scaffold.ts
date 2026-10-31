/** Auth plugin adapter scaffold entrypoint.
 *
 * @module
 */

import {
  createPluginAdapter,
  type PluginScaffoldEntrypoint,
  runPluginScaffoldCli,
  type ScaffoldResult,
} from '@netscript/plugin/adapter';
import {
  AUTH_BACKEND_ENV,
  createAuthAdapterPlugin,
  DEFAULT_AUTH_BACKEND,
} from './src/adapter/plugin.ts';

export type {
  PluginLogger,
  PluginScaffoldEntrypoint,
  ScaffolderContext,
  ScaffoldResult,
} from '@netscript/plugin/adapter';

/** Auth adapter scaffold entrypoint. */
const scaffold: PluginScaffoldEntrypoint = (context): Promise<ScaffoldResult> => {
  const configuration = context.options.configuration;
  const selected = configuration !== null && typeof configuration === 'object'
    ? Reflect.get(configuration, AUTH_BACKEND_ENV)
    : undefined;
  const backend = typeof selected === 'string'
    ? selected
    : Deno.env.get(AUTH_BACKEND_ENV) ?? DEFAULT_AUTH_BACKEND;
  return createPluginAdapter(createAuthAdapterPlugin(backend)).toScaffold()(context);
};

export default scaffold;

if (import.meta.main) {
  await runPluginScaffoldCli(scaffold);
}
