import { assert, assertEquals } from '@std/assert';

Deno.test('runPluginScaffoldCli prints one JSON stdout line and keeps logs on stderr', async () => {
  const tempDir = await Deno.makeTempDir();
  const scriptPath = `${tempDir}/scaffold-runner-fixture.ts`;
  const adapterModule = new URL('./mod.ts', import.meta.url).href;
  const contextJson = JSON.stringify({
    workspaceRoot: '/tmp/netscript-scaffold-cli-bridge',
    options: { pluginName: 'workers' },
    dryRun: true,
  });
  const expectedResult = {
    status: 'planned',
    createdFiles: ['src/jobs/example.ts'],
    modifiedFiles: [],
    databaseMigrationsAdded: false,
  };

  await Deno.writeTextFile(
    scriptPath,
    `
      import { runPluginScaffoldCli, type PluginScaffoldEntrypoint } from ${
      JSON.stringify(adapterModule)
    };

      const entrypoint: PluginScaffoldEntrypoint = async (context) => {
        context.logger.info('fixture-log', {
          pluginName: context.options.pluginName,
          dryRun: context.dryRun,
        });
        return ${JSON.stringify(expectedResult)};
      };

      await runPluginScaffoldCli(entrypoint);
    `,
  );

  const output = await new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--config',
      'deno.json',
      '--allow-read',
      scriptPath,
      '--context-json',
      contextJson,
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();

  const decoder = new TextDecoder();
  const stdout = decoder.decode(output.stdout);
  const stderr = decoder.decode(output.stderr);
  const lines = stdout.trim().split(/\r?\n/).filter((line) => line.length > 0);

  assertEquals(output.code, 0, stderr);
  assertEquals(lines.length, 1);
  assertEquals(JSON.parse(lines[0]), expectedResult);
  assert(stderr.includes('fixture-log'));
  assert(!stdout.includes('fixture-log'));
});
