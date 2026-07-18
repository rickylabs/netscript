import { assertEquals } from '@std/assert';
import { LocalProjectFiles } from '@netscript/plugin/cli';
import { LocalSagasRuntimeBackend } from '../../src/cli/local-runtime-backend.ts';
import { SagasCli } from '../../src/cli/sagas-cli.ts';

Deno.test('sagas add-saga --dry-run writes nothing and reports the real plan', async () => {
  const dryRoot = await Deno.makeTempDir();
  const realRoot = await Deno.makeTempDir();
  try {
    const dry = await run(dryRoot, true);
    assertEquals(await snapshot(dryRoot), []);
    await run(realRoot, false);
    assertEquals(files(dry), await snapshot(realRoot));
  } finally {
    await Deno.remove(dryRoot, { recursive: true });
    await Deno.remove(realRoot, { recursive: true });
  }
});

async function run(root: string, dryRun: boolean) {
  const cli = new SagasCli(new LocalSagasRuntimeBackend({ files: new LocalProjectFiles(root) }));
  return await cli.commands().find((item) => item.name === 'add-saga')!.run({
    command: 'add-saga',
    values: ['checkout'],
    flags: dryRun ? { 'dry-run': true } : {},
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
