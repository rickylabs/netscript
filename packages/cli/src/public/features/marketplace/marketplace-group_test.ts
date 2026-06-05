import { assertEquals } from 'jsr:@std/assert@^1';

import { createMarketplacePublishCommand } from './publish/marketplace-publish-command.ts';
import { createMarketplaceSearchCommand } from './search/marketplace-search-command.ts';

Deno.test('marketplace search prints JSR discovery guidance', async () => {
  const lines: string[] = [];
  await createMarketplaceSearchCommand({ print: (message) => lines.push(message) }).parse([
    'worker queue',
  ]);

  assertEquals(lines, [
    'Plugin marketplace coming soon.',
    'Find plugins at https://jsr.io/?search=netscript-plugin-worker%20queue',
  ]);
});

Deno.test('marketplace publish prints temporary publishing guidance', async () => {
  const lines: string[] = [];
  await createMarketplacePublishCommand({ print: (message) => lines.push(message) }).parse([]);

  assertEquals(lines, [
    'Plugin marketplace publishing coming soon.',
    'Publish plugin packages to JSR with the netscript-plugin keyword for now.',
  ]);
});
