import { assertEquals } from '@std/assert';
import { LocalProjectFiles } from '@netscript/plugin/cli';
import { LocalTriggersRuntimeBackend } from '../../src/cli/local-runtime-backend.ts';
import { TriggersCli } from '../../src/cli/triggers-cli.ts';

const cases: readonly Readonly<{
  command: string;
  flags: Readonly<Record<string, string | boolean>>;
}>[] = [
  { command: 'add-webhook', flags: { path: '/hooks/order' } },
  { command: 'add-file-watch', flags: { path: './inbox' } },
  { command: 'add-scheduled', flags: { cron: '0 * * * *' } },
];
for (const test of cases) {
  Deno.test(`triggers ${test.command} --dry-run writes nothing and reports the real plan`, async () => {
    const dryRoot = await Deno.makeTempDir();
    const realRoot = await Deno.makeTempDir();
    try {
      const dry = await run(dryRoot, test.command, { ...test.flags, 'dry-run': true });
      assertEquals(await snapshot(dryRoot), []);
      await run(realRoot, test.command, test.flags);
      assertEquals(files(dry), await snapshot(realRoot));
    } finally {
      await Deno.remove(dryRoot, { recursive: true });
      await Deno.remove(realRoot, { recursive: true });
    }
  });
}

async function run(
  root: string,
  command: string,
  flags: Readonly<Record<string, string | boolean>>,
) {
  const cli = new TriggersCli(
    new LocalTriggersRuntimeBackend({ files: new LocalProjectFiles(root) }),
  );
  return await cli.commands().find((item) => item.name === command)!.run({
    command,
    values: ['sample'],
    flags,
  });
}

function files(result: { data?: unknown }): readonly string[] {
  return (result.data as { files: readonly string[] }).files.slice().sort();
}

async function snapshot(root: string): Promise<string[]> {
  const files: string[] = [];
  async function collect(path: string): Promise<void> {
    for await (const entry of Deno.readDir(path)) {
      const target = `${path}/${entry.name}`;
      if (entry.isDirectory) await collect(target);
      else files.push(target.slice(root.length + 1));
    }
  }
  await collect(root);
  return files.sort();
}
