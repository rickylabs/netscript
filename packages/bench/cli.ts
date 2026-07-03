/**
 * `@netscript/bench` CLI entrypoint. Thin shim over the presentation layer.
 *
 * @module
 */

import { runCli } from './src/presentation/cli.ts';

if (import.meta.main) {
  await runCli(Deno.args);
}
