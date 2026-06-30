import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { streamsPlugin } from '../../mod.ts';
import { verifyStreamsPlugin } from '../../verify-plugin.ts';
import denoJson from '../../deno.json' with { type: 'json' };

Deno.test('streamsPlugin manifest exposes service, telemetry, E2E, Aspire, and helper axes', () => {
  assertEquals(streamsPlugin.name, '@netscript/plugin-streams');
  assertEquals(streamsPlugin.version, denoJson.version);
  assertEquals(streamsPlugin.type, 'utility');

  assert(streamsPlugin.contributions.services?.some((service) => service.name === 'streams'));
  assert(streamsPlugin.contributions.telemetry?.some((telemetry) => telemetry.name === 'streams'));
  assert(streamsPlugin.contributions.e2e?.some((gate) => gate.name === 'streams-health'));
  assertEquals(streamsPlugin.contributions.aspire, './src/aspire/mod.ts');

  const verification = verifyStreamsPlugin();
  assertEquals(verification.ok, true);
  assertEquals(verification.findings, []);
  assertEquals(verification.inspection.details.contributionGroups, 4);
});
