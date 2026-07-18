import { assertEquals } from '@std/assert';
import { LocalProjectFiles } from '@netscript/plugin/cli';
import { LocalWorkersRuntimeBackend } from '../../src/cli/local-runtime-backend.ts';
import { WorkersCli } from '../../src/cli/workers-cli.ts';

const cases: readonly Readonly<{
  command: string;
  values: readonly string[];
  flags: Readonly<Record<string, string | boolean>>;
}>[] = [
  { command: 'add-job', values: ['email-digest'], flags: {} },
  { command: 'add-task', values: ['thumbnail'], flags: { runtime: 'deno' } },
  { command: 'add-workflow', values: ['onboarding'], flags: {} },
];
for (const test of cases) {
  Deno.test(`workers ${test.command} --dry-run writes nothing and reports the real plan`, async () => {
    const dryRoot = await Deno.makeTempDir();
    const realRoot = await Deno.makeTempDir();
    try {
      const dry = await run(dryRoot, test.command, test.values, { ...test.flags, 'dry-run': true });
      assertEquals(await snapshot(dryRoot), []);
      await run(realRoot, test.command, test.values, test.flags);
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
  values: readonly string[],
  flags: Readonly<Record<string, string | boolean>>,
) {
  const cli = new WorkersCli(
    new LocalWorkersRuntimeBackend({ files: new LocalProjectFiles(root) }),
  );
  return await cli.commands().find((item) => item.name === command)!.run({
    command,
    values,
    flags,
  });
}

function files(result: { data?: unknown }): readonly string[] {
  return (result.data as { files: readonly string[] }).files.slice().sort();
}

async function snapshot(root: string): Promise<string[]> {
  const entries: string[] = [];
  for await (const entry of Deno.readDir(root)) {
    await collect(`${root}/${entry.name}`, entry, entries, root);
  }
  return entries.sort();
}

async function collect(
  path: string,
  entry: Deno.DirEntry,
  files: string[],
  root: string,
): Promise<void> {
  if (entry.isDirectory) {
    for await (const child of Deno.readDir(path)) {
      await collect(`${path}/${child.name}`, child, files, root);
    }
  } else files.push(path.slice(root.length + 1));
}
