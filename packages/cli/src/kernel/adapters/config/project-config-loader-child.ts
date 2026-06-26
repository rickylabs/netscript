/**
 * Child-process entrypoint for loading project configuration under the
 * project's own `deno.json`.
 */

import { loadConfig } from '@netscript/config';

function readOption(name: string): string | undefined {
  const prefix = `${name}=`;
  for (let index = 0; index < Deno.args.length; index += 1) {
    const arg = Deno.args[index];
    if (arg === name) return Deno.args[index + 1];
    if (arg.startsWith(prefix)) return arg.slice(prefix.length);
  }
  return undefined;
}

const projectRoot = readOption('--project-root') ?? Deno.cwd();
const configFile = readOption('--config-file');
const config = await loadConfig(
  configFile ? { cwd: projectRoot, configFile } : { cwd: projectRoot },
);

await Deno.stdout.write(
  new TextEncoder().encode(`${JSON.stringify(config)}\n`),
);
