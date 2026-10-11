import { assertEquals, assertRejects } from '@std/assert';
import { createContributionExtractor } from './contribution-extractor.ts';

Deno.test('CLI discovers every recognizable first-party factory without installed declarations', async () => {
  const expected: Readonly<Record<string, string | null>> = {
    defineJob: 'jobs',
    defineTask: 'tasks',
    defineWorkflow: 'workflows',
    defineSaga: 'sagas',
    defineSignal: null,
    defineQuery: null,
    defineStreamSchema: null,
    defineWebhook: 'triggers',
    defineScheduledTrigger: 'triggers',
    defineFileWatch: 'triggers',
  };
  // Match the SDK's root and /builders recognizer across every workspace core,
  // including cores that currently export no factories and future core packages.
  const packages = new URL('../../../../../', import.meta.url);
  for await (const entry of Deno.readDir(packages)) {
    if (!entry.isDirectory || !/^plugin-.+-core$/.test(entry.name)) continue;
    const packageRoot = new URL(`${entry.name}/`, packages);
    const config: { name: string; exports: Record<string, string> } = JSON.parse(
      await Deno.readTextFile(new URL('deno.json', packageRoot)),
    );
    for (const subpath of ['.', './builders']) {
      const module = config.exports[subpath];
      if (!module) continue;
      const exports: Record<string, unknown> = await import(new URL(module, packageRoot).href);
      const specifier = config.name + (subpath === '.' ? '' : '/builders');
      const factories = Object.keys(exports).filter((name) =>
        /^define(?!.*(?:Config|Handler)$)[A-Z][\w$]*$/.test(name)
      );
      for (const callee of factories) {
        assertEquals(callee in expected, true, `Missing discovery contract for ${callee}`);
        const contributions = await createContributionExtractor().extract([{
          path: `${entry.name}/definition.ts`,
          text: `import { ${callee} } from '${specifier}';
export default ${callee}('example');`,
        }]);
        assertEquals(
          contributions,
          expected[callee] === null ? [] : [{
            file: `${entry.name}/definition.ts`,
            symbol: 'default',
            axis: expected[callee],
          }],
        );
      }
    }
  }
});

Deno.test('CLI factory metadata still rejects conflicting project declarations', async () => {
  await assertRejects(
    async () => {
      await createContributionExtractor().extract([{
        path: 'plugin.ts',
        text: `export const NETSCRIPT_CONTRIBUTION_BUILDERS = [
  { callee: 'defineTask', axis: 'jobs' },
] as const;`,
      }]);
    },
    TypeError,
    'Duplicate contribution builder callee "defineTask"',
  );
});
