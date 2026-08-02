import { dirname, fromFileUrl, join } from '@std/path';

const repo = dirname(dirname(dirname(dirname(fromFileUrl(import.meta.url)))));
const destination = join(repo, '.agents', 'generated', 'consumer-skills');
await Deno.mkdir(destination, { recursive: true });

const command = new Deno.Command(Deno.execPath(), {
  cwd: destination,
  args: [
    'run',
    '-A',
    join(repo, 'packages', 'cli', 'bin', 'netscript-dev.ts'),
    'agent',
    'init',
    '--host',
    'claude',
  ],
  stdout: 'inherit',
  stderr: 'inherit',
});
const result = await command.output();
if (!result.success) Deno.exit(result.code);
console.log(`Consumer agent bundle installed at ${destination}`);
