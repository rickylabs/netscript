import { StreamsCli } from '../streams-cli.ts';

/** CLI command group for the streams plugin. */
export { StreamsCli };
export type {
  PluginCli,
  PluginCliArgs,
  PluginCliCommand,
  PluginCliResult,
} from '@netscript/plugin/cli';

/** Default CLI instance used by `deno dx jsr:@netscript/plugin-streams/cli`. */
export const streamsCli: StreamsCli = new StreamsCli();

if (import.meta.main) {
  const [command = 'list-topics', ...values] = Deno.args;
  const result = await streamsCli.run({ command, values });
  if (result.message) {
    if (result.code === 0) {
      console.log(result.message);
    } else {
      console.error(result.message);
    }
  }
  if (result.data !== undefined) {
    console.log(JSON.stringify(result.data, null, 2));
  }
  Deno.exitCode = result.code;
}
