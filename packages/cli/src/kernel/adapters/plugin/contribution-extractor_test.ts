import { assertEquals, assertRejects } from '@std/assert';
import * as workers from '@netscript/plugin-workers-core/builders';
import * as sagas from '@netscript/plugin-sagas-core/builders';
import * as streams from '@netscript/plugin-streams-core';
import * as triggers from '@netscript/plugin-triggers-core/builders';
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
  for (const [kind, exports] of Object.entries({ workers, sagas, streams, triggers })) {
    const factories = Object.keys(exports).filter((name) =>
      /^define(?!.*(?:Config|Handler)$)[A-Z][\w$]*$/.test(name)
    );
    for (const callee of factories) {
      assertEquals(callee in expected, true, `Missing discovery contract for ${callee}`);
      const contributions = await createContributionExtractor().extract([{
        path: `${kind}/definition.ts`,
        text: `import { ${callee} } from '@netscript/plugin-${kind}-core';
export default ${callee}('example');`,
      }]);
      assertEquals(
        contributions,
        expected[callee] === null ? [] : [{
          file: `${kind}/definition.ts`,
          symbol: 'default',
          axis: expected[callee],
        }],
      );
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
