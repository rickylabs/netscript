import { assertEquals } from '@std/assert';
import { writeStreamArtifacts } from '../../src/cli/adapters/artifact-writer.ts';
import { StreamsCli } from '../../src/cli/streams-cli.ts';
import type { StreamsCliServices } from '../../src/cli/streams-types.ts';

const cases: readonly Readonly<{
  command: string;
  values: readonly string[];
  flags: Readonly<Record<string, string | boolean>>;
}>[] = [
  { command: 'add-schema', values: ['orders'], flags: {} },
  {
    command: 'add-producer',
    values: ['orders'],
    flags: { 'stream-path': '/orders', 'producer-id': 'orders-producer' },
  },
  { command: 'add-consumer', values: ['orders'], flags: {} },
];
for (const test of cases) {
  Deno.test(`streams ${test.command} --dry-run writes nothing and reports the real plan`, async () => {
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
  const services: StreamsCliServices = {
    workspaceRoot: () => root,
    writeArtifacts: writeStreamArtifacts,
    discoverTopics: () => Promise.resolve([]),
    publish: () => Promise.resolve({}),
    subscribe: () => Promise.resolve([]),
    inspect: () => {
      throw new Error('not used by add command tests');
    },
    clear: () => Promise.resolve(),
  };
  const cli = new StreamsCli(services);
  return await cli.commands().find((item) => item.name === command)!.run({
    command,
    values,
    flags,
  });
}

function files(result: { data?: unknown }): readonly string[] {
  return (result.data as { createdFiles: readonly string[] }).createdFiles.slice().sort();
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
