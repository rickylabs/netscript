import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { inspectPlugin } from '@netscript/plugin';
import { workersPlugin } from '../../mod.ts';
import { verifyWorkersPlugin } from '../../verify-plugin.ts';
import denoJson from '../../deno.json' with { type: 'json' };

Deno.test('workersPlugin manifest exposes service, processor, stream, contract, config, E2E, and Aspire axes', () => {
  assertEquals(workersPlugin.name, '@netscript/plugin-workers');
  assertEquals(workersPlugin.version, denoJson.version);
  assertEquals(workersPlugin['type'], 'background-processor');

  assert(workersPlugin.dependencies?.streams);
  assert(workersPlugin.contributions.services?.some((service) => service.name === 'workers-api'));

  const processors = workersPlugin.contributions.backgroundProcessors ?? [];
  assert(processors.some((processor) => processor.name === 'workers-combined'));
  assert(processors.some((processor) => processor.name === 'workers-worker'));
  assert(processors.some((processor) => processor.name === 'workers-scheduler'));

  const topics = workersPlugin.contributions.streamTopics ?? [];
  assert(topics.some((topic) => topic.name === 'workers.jobs'));
  assert(topics.some((topic) => topic.name === 'workers.tasks'));
  assert(topics.some((topic) => topic.name === 'workers.workflows'));

  assert(
    workersPlugin.contributions.databaseSchemas?.some((schema) =>
      schema.path === './database/workers.prisma' && schema.engine === 'postgres'
    ),
  );
  assert(
    workersPlugin.contributions.contractVersions?.some((contract) =>
      contract.version === 'v1' && contract.loader === './contracts/v1/mod.ts'
    ),
  );
  assert(
    workersPlugin.contributions.runtimeConfigTopics?.some((topic) => topic.name === 'workers'),
  );
  assert(
    workersPlugin.contributions.e2e?.some((gate) =>
      gate.name === 'workers-health' && gate.command === 'deno task workers:e2e'
    ),
  );
  assertEquals(workersPlugin.contributions.aspire, './src/aspire/mod.ts');

  const inspection = inspectPlugin(workersPlugin);
  assertEquals(inspection.target, '@netscript/plugin-workers');
  assertEquals(inspection.details.version, denoJson.version);
  assertEquals(
    inspection.details.contributionGroups,
    Object.keys(workersPlugin.contributions).length,
  );

  const verification = verifyWorkersPlugin();
  assertEquals(verification.ok, true);
  assertEquals(verification.findings, []);
});
