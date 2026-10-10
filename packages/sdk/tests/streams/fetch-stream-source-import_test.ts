import { assert, assertEquals } from '@std/assert';

interface InfoGraph {
  readonly modules: readonly { readonly specifier: string; readonly local?: string }[];
}

async function unsafeModules(entry: URL): Promise<string[]> {
  const output = await new Deno.Command(Deno.execPath(), {
    args: ['info', '--json', entry.href],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!output.success) throw new Error(new TextDecoder().decode(output.stderr));
  const graph: InfoGraph = JSON.parse(new TextDecoder().decode(output.stdout));
  const unsafe = [];
  for (const module of graph.modules) {
    if (/telemetry|opentelemetry|^node:/.test(module.specifier)) {
      unsafe.push(module.specifier);
    } else if (module.local && /\bDeno\s*\./.test(await Deno.readTextFile(module.local))) {
      unsafe.push(`${module.specifier} uses Deno APIs`);
    }
  }
  return unsafe.sort();
}

Deno.test('published fetch consumer excludes telemetry, OTel and Deno API modules', async () => {
  const root = new URL('../../', import.meta.url);
  const manifest = JSON.parse(await Deno.readTextFile(new URL('deno.json', root)));
  assertEquals(manifest.exports['./streams/consumer'], './src/client/stream-source/mod.ts');
  assertEquals(manifest.exports['./streams/collections'], './src/client/stream-collection/mod.ts');
  assertEquals(manifest.exports['./streams/react'], './src/client/stream-react/mod.ts');
  for (const key of ['./streams/collections', './streams/react']) {
    assertEquals(await unsafeModules(new URL(manifest.exports[key], root)), []);
  }
  const consumer = new URL(manifest.exports['./streams/consumer'], root);
  assertEquals(await unsafeModules(consumer), []);

  // The server producer facade is a positive control for the unsafe-graph detector.
  const producer = await unsafeModules(new URL('../../src/streams.ts', import.meta.url));
  assert(producer.some((entry) => entry.includes('telemetry')));
  assert(producer.some((entry) => entry.includes('opentelemetry')));
  assert(producer.some((entry) => entry.endsWith('uses Deno APIs')));
});
