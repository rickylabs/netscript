import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { authPlugin, inspectAuth } from '../../mod.ts';
import { verifyAuthPlugin } from '../../verify-plugin.ts';

Deno.test('authPlugin manifest exposes service, contract, and config axes', () => {
  assertEquals(authPlugin.name, '@netscript/plugin-auth');
  assertEquals(authPlugin.version, '0.1.0');
  assertEquals(authPlugin['type'], 'api');

  assert(authPlugin.contributions.services?.some((service) => service.name === 'auth-api'));
  assert(
    authPlugin.contributions.contractVersions?.some((contract) =>
      contract.version === 'v1' && contract.loader === './contracts.ts'
    ),
  );
  assert(authPlugin.contributions.runtimeConfigTopics?.some((topic) => topic.name === 'auth'));

  const inspection = inspectAuth();
  assertEquals(inspection.name, '@netscript/plugin-auth');
  assertEquals(inspection.version, '0.1.0');
  assertEquals(inspection.dependencies, []);

  const verification = verifyAuthPlugin();
  assertEquals(verification.ok, true);
  assertEquals(verification.findings, []);
});
