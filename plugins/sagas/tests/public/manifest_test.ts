import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { inspectSagas, sagasPlugin } from '../../mod.ts';
import { verifySagasPlugin } from '../../verify-plugin.ts';
import denoJson from '../../deno.json' with { type: 'json' };

Deno.test('sagasPlugin manifest exposes dependencies, service, schema, contract, config, and Aspire axes', () => {
  assertEquals(sagasPlugin.name, '@netscript/plugin-sagas');
  assertEquals(sagasPlugin.version, denoJson.version);
  assertEquals(sagasPlugin['type'], 'background-processor');

  assert(sagasPlugin.dependencies?.workers);
  assert(sagasPlugin.dependencies?.streams);
  assert(sagasPlugin.contributions.services?.some((service) => service.name === 'sagas-api'));
  assert(
    sagasPlugin.contributions.databaseSchemas?.some((schema) =>
      schema.path === './database/sagas.prisma' && schema.engine === 'postgres'
    ),
  );
  assert(
    sagasPlugin.contributions.contractVersions?.some((contract) =>
      contract.version === 'v1' && contract.loader === './contracts/v1/mod.ts'
    ),
  );
  assert(
    sagasPlugin.contributions.runtimeConfigTopics?.some((topic) => topic.name === 'sagas'),
  );
  assertEquals(sagasPlugin.contributions.aspire, './src/aspire/mod.ts');

  const inspection = inspectSagas();
  assertEquals(inspection.name, '@netscript/plugin-sagas');
  assertEquals(inspection.version, denoJson.version);
  assertEquals(inspection.dependencies, ['workers', 'streams']);

  const verification = verifySagasPlugin();
  assertEquals(verification.ok, true);
  assertEquals(verification.findings, []);
});
