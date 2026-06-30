import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { inspectPlugin } from '@netscript/plugin';
import {
  TRIGGERS_API_DEFAULT_PORT,
  TRIGGERS_API_SERVICE_NAME,
  TRIGGERS_PLUGIN_ID,
  TRIGGERS_PLUGIN_VERSION,
  triggersPlugin,
} from '../../mod.ts';
import { verifyTriggersPlugin } from '../../verify-plugin.ts';

Deno.test('triggersPlugin manifest exposes core dependencies, service, contract, config, and Aspire axes', () => {
  assertEquals(triggersPlugin.name, '@netscript/plugin-triggers');
  assertEquals(triggersPlugin.version, TRIGGERS_PLUGIN_VERSION);
  assertEquals(triggersPlugin['type'], 'background-processor');

  assert(triggersPlugin.dependencies?.workersCore);
  assert(triggersPlugin.dependencies?.streamsCore);
  assert(triggersPlugin.dependencies?.sagasCore);
  assert(
    triggersPlugin.contributions.services?.some((service) =>
      service.name === TRIGGERS_API_SERVICE_NAME &&
      service.entrypoint === './services/src/main.ts' &&
      service.port === TRIGGERS_API_DEFAULT_PORT
    ),
  );
  assert(
    triggersPlugin.contributions.contractVersions?.some((contract) =>
      contract.version === 'v1' && contract.loader === './contracts/v1/mod.ts'
    ),
  );
  assert(
    triggersPlugin.contributions.runtimeConfigTopics?.some((topic) =>
      topic.name === TRIGGERS_PLUGIN_ID && topic.schemaPath === './runtime/triggers.schema.json'
    ),
  );
  assert(
    triggersPlugin.contributions.e2e?.some((gate) =>
      gate.name === 'triggers-health' && gate.command === 'deno task triggers:e2e'
    ),
  );
  assertEquals(triggersPlugin.contributions.aspire, './src/aspire/mod.ts');

  const inspection = inspectPlugin(triggersPlugin);
  assertEquals(inspection.target, '@netscript/plugin-triggers');
  assertEquals(inspection.details.version, TRIGGERS_PLUGIN_VERSION);
  assertEquals(
    inspection.details.contributionGroups,
    Object.keys(triggersPlugin.contributions).length,
  );

  const verification = verifyTriggersPlugin();
  assertEquals(verification.ok, true);
  assertEquals(verification.findings, []);
  assertEquals(verification.inspection.details.contributionGroups, 5);
});
