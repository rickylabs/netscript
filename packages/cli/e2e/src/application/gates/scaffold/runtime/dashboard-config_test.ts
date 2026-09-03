import { assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import { DASHBOARD_ANONYMOUS_KEY, disableAnonymousDashboard } from './dashboard-config.ts';

Deno.test('disableAnonymousDashboard flips the https profile key in place', async () => {
  const root = await Deno.makeTempDir();
  try {
    const appHost = join(root, 'aspire', 'apphost.mts');
    await Deno.mkdir(join(root, 'aspire'));
    await Deno.writeTextFile(
      join(root, 'aspire', 'aspire.config.json'),
      JSON.stringify({
        profiles: {
          https: { environmentVariables: { [DASHBOARD_ANONYMOUS_KEY]: 'true', KEEP: '1' } },
        },
      }),
    );
    const configPath = await disableAnonymousDashboard(appHost);
    const config = JSON.parse(await Deno.readTextFile(configPath));
    assertEquals(config.profiles.https.environmentVariables, {
      [DASHBOARD_ANONYMOUS_KEY]: 'false',
      KEEP: '1',
    });
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('disableAnonymousDashboard rejects a config without the https profile', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(join(root, 'aspire'));
    await Deno.writeTextFile(join(root, 'aspire', 'aspire.config.json'), '{"profiles":{}}');
    await assertRejects(
      () => disableAnonymousDashboard(join(root, 'aspire', 'apphost.mts')),
      Error,
      'profiles.https.environmentVariables',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
