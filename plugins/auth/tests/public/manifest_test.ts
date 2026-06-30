import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { inspectPlugin } from '@netscript/plugin';
import { AUTH_PLUGIN_VERSION, authPlugin } from '../../mod.ts';
import { verifyAuthPlugin } from '../../verify-plugin.ts';

Deno.test('authPlugin manifest exposes service, contract, and config axes', () => {
  assertEquals(authPlugin.name, '@netscript/plugin-auth');
  assertEquals(authPlugin.version, AUTH_PLUGIN_VERSION);
  assertEquals(authPlugin['type'], 'api');

  assert(authPlugin.contributions.services?.some((service) => service.name === 'auth-api'));
  assert(
    authPlugin.contributions.contractVersions?.some((contract) =>
      contract.version === 'v1' && contract.loader === './contracts/v1/mod.ts'
    ),
  );
  assert(authPlugin.contributions.runtimeConfigTopics?.some((topic) => topic.name === 'auth'));

  const inspection = inspectPlugin(authPlugin);
  assertEquals(inspection.target, '@netscript/plugin-auth');
  assertEquals(inspection.details.version, AUTH_PLUGIN_VERSION);
  assertEquals(
    inspection.details.contributionGroups,
    Object.keys(authPlugin.contributions).length,
  );

  const verification = verifyAuthPlugin();
  assertEquals(verification.ok, true);
  assertEquals(verification.findings, []);
});
