import { assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl } from '@std/path';
import { LocalProjectFiles } from '@netscript/plugin/cli';
import { AddJobCommand } from '../../src/cli/commands.ts';
import { LocalWorkersRuntimeBackend } from '../../src/cli/local-runtime-backend.ts';

const root = fromFileUrl(new URL('../../../../', import.meta.url));

const fixtures: readonly {
  name: string;
  id: string;
  flags: Record<string, string | number | boolean>;
  retries: number;
  policy: string;
}[] = [
  { name: 'Plain Job', id: 'plain-job', flags: {}, retries: 3, policy: '' },
  { name: 'Retry Job', id: 'retry-job', flags: { 'max-retries': 5 }, retries: 3, policy: '' },
  {
    name: 'Hook Job',
    id: 'hook-job',
    flags: { template: 'webhook-delivery' },
    retries: 0,
    policy: ', {"id":"hook-job","maxRetries":0,"entrypoint":"./hook-job.ts"}',
  },
];
for (const fixture of fixtures) {
  Deno.test('registry golden preserves key and retry count for ' + fixture.name, async (t) => {
    const directory = await Deno.makeTempDir({ prefix: 'worker-registry-golden-' });
    try {
      const command = new AddJobCommand(
        new LocalWorkersRuntimeBackend({ files: new LocalProjectFiles(directory) }),
      );
      const result = await command.run({
        command: 'add-job',
        values: [fixture.name],
        flags: fixture.flags,
      });
      assertEquals(result.code, 0, result.message);
      const path = directory + '/workers/jobs/' + fixture.id + '.ts';
      const config = JSON.parse(await Deno.readTextFile(root + '/deno.json'));
      const source = await Deno.readTextFile(path);
      // Resolve the consumer import map when importing an isolated temporary project.
      await Deno.writeTextFile(
        path,
        source.replace("from 'zod'", "from 'npm:zod@" + config.catalog.zod + "'")
          .replace("from '@std/async'", "from 'jsr:@std/async@^1'"),
      );
      const registryPath = directory + '/.netscript/generated/plugin-workers/job-registry.ts';
      const registrySource = await Deno.readTextFile(registryPath);
      const registry: {
        definitions: ReadonlyMap<string, { id: string; maxRetries: number }>;
      } = await import('file://' + registryPath);
      await t.step('filename-derived registry key and generated registration golden', () => {
        assertEquals([...registry.definitions.keys()], [fixture.id]);
        assertStringIncludes(
          registrySource,
          '  ["' + fixture.id + '"]: createLocalJobDefinition("' + fixture.id + '", "./' +
            fixture.id + '.ts", jobHandlersById["' + fixture.id + '"]' + fixture.policy + '),',
        );
      });
      await t.step('runtime retry count', () => {
        // Assert independently of the key so both regressions fire on the reviewed head.
        assertEquals([...registry.definitions.values()].map((job) => job.maxRetries), [
          fixture.retries,
        ]);
      });
    } finally {
      await Deno.remove(directory, { recursive: true });
    }
  });
}
