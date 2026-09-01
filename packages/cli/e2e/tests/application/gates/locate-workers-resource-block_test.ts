import { assertEquals, assertRejects } from '@std/assert';

interface SourceRange {
  readonly start: number;
  readonly end: number;
}

const currentWorkersBlock = `    const resource = builder.addExecutable('workers-api', 'deno', workdir, [
      'run', '--config', 'deno.json', '@netscript/plugin-workers/services',
    ])
      .withHttpEndpoint({ name: 'http' });

    await resource.withEnvironment('NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE', bootstrapModule);

    plugins.set('workers-api', resource);`;

const currentRegisterPlugins = `export async function registerPlugins() {
  // --- plugin 0 ---
  {
    const resource = builder.addExecutable('streams-api', 'deno', workdir, ['run', 'streams']);
    plugins.set('streams-api', resource);
  }

  // --- plugin 1 ---
  {
${currentWorkersBlock}
  }

  // --- plugin 2 ---
  {
    const resource = builder.addExecutable('sagas-api', 'deno', workdir, ['run', 'sagas']);
    plugins.set('sagas-api', resource);
  }

  // --- plugin 2: wire PluginReferences via endpoint env vars ---
  {
    const resource = plugins.get('sagas-api');
    const workers = plugins.get('workers-api');
  }
}`;

Deno.test('workers range accepts current positional-marker generated output', async () => {
  const range = await locateWorkersResourceBlock(currentRegisterPlugins);

  assertEquals(currentRegisterPlugins.slice(range.start, range.end), currentWorkersBlock);
});

Deno.test('workers range rejects generated output without a workers resource block', async () => {
  const withoutWorkersBlock = `export async function registerPlugins() {
  // --- plugin 0 ---
  {
    const resource = builder.addExecutable('sagas-api', 'deno', workdir, ['run', 'sagas']);
    plugins.set('sagas-api', resource);
  }

  // A reference to workers is not a workers resource block.
  const workers = plugins.get('workers-api');
}`;

  await assertRejects(
    () => locateWorkersResourceBlock(withoutWorkersBlock),
    Error,
    'workers-api resource block',
  );
});

Deno.test('workers range rejects a malformed workers block without registration', async () => {
  const malformedWorkersBlock = `export async function registerPlugins() {
  // --- plugin 0 ---
  {
    const resource = builder.addExecutable('workers-api', 'deno', workdir, [
      'run', '--config', 'deno.json', '@netscript/plugin-workers/services',
    ]);
  }
}`;

  await assertRejects(
    () => locateWorkersResourceBlock(malformedWorkersBlock),
    Error,
    'workers-api resource block',
  );
});

async function locateWorkersResourceBlock(source: string): Promise<SourceRange> {
  const moduleUrl = new URL(
    '../../../src/application/gates/scaffold/locate-workers-resource-block.ts',
    import.meta.url,
  ).href;
  const module = await import(moduleUrl);
  return module.locateWorkersResourceBlock(source) as SourceRange;
}
