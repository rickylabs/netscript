import { assertEquals, assertRejects } from 'jsr:@std/assert';
import {
  backgroundProcessorEntrySchema,
  installedVersionSchema,
  pluginEntrySchema,
} from '../../src/schema/plugins/mod.ts';

Deno.test('pluginEntrySchema: applies appsettings defaults for plugin services', () => {
  const entry = pluginEntrySchema.parse({
    Port: 8091,
    InstalledVersion: '0.0.1-alpha.0',
    InstalledFrom: 'jsr:@netscript/plugin-workers@^0.0.1-alpha.0',
  });

  assertEquals(entry.Enabled, true);
  assertEquals(entry.Runtime, 'deno');
  assertEquals(entry.Entrypoint, 'src/main.ts');
  assertEquals(entry.RequiresDb, false);
  assertEquals(entry.RequiresKv, false);
});

Deno.test('backgroundProcessorEntrySchema: applies appsettings defaults for processors', () => {
  const entry = backgroundProcessorEntrySchema.parse({
    InstalledVersion: '0.0.1-alpha.0',
    InstalledFrom: 'workspace:plugins/workers',
  });

  assertEquals(entry.Enabled, true);
  assertEquals(entry.Runtime, 'deno');
  assertEquals(entry.Entrypoint, 'bin/combined.ts');
  assertEquals(entry.Telemetry, true);
  assertEquals(entry.WatchMode, false);
});

Deno.test('installedVersionSchema: rejects empty version metadata', async () => {
  await assertRejects(
    () =>
      Promise.resolve().then(() =>
        installedVersionSchema.parse({
          InstalledVersion: '',
          InstalledFrom: '',
        })
      ),
    Error,
  );
});
