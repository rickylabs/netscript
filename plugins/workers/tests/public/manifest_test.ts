import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { inspectWorkers, workersPlugin } from '../../mod.ts';
import { verifyWorkersPlugin } from '../../verify-plugin.ts';

Deno.test('workersPlugin manifest exposes service, processor, stream, contract, config, E2E, and Aspire axes', () => {
  assertEquals(workersPlugin.name, '@netscript/plugin-workers');
  assertEquals(workersPlugin.version, '0.0.1-alpha.0');
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

  const inspection = inspectWorkers();
  assertEquals(inspection.name, '@netscript/plugin-workers');
  assertEquals(inspection.version, '0.0.1-alpha.0');
  assertEquals(inspection.dependencies, ['streams']);

  const verification = verifyWorkersPlugin();
  assertEquals(verification.ok, true);
  assertEquals(verification.findings, []);
});
