import { assertEquals } from '@std/assert';

import { join } from '@std/path';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { getDottedValue, setProjectConfigValue } from './project-config-ops.ts';

Deno.test('getDottedValue reads resolved telemetry paths', () => {
  assertEquals(
    getDottedValue({ telemetry: { otlpEndpoint: 'http://localhost:4318' } }, 'telemetry.otlpEndpoint'),
    'http://localhost:4318',
  );
});

Deno.test('setProjectConfigValue maps telemetry endpoint into generated AppSettings', async () => {
  const root = await Deno.makeTempDir();
  const fs = new DenoFileSystem();
  try {
    await fs.writeFile(join(root, 'appsettings.json'), JSON.stringify({ NetScript: {} }));
    await setProjectConfigValue(fs, root, 'telemetry.otlpEndpoint', 'http://otel:4318');
    assertEquals(JSON.parse(await fs.readFile(join(root, 'appsettings.json'))), {
      NetScript: { Otel: { HttpEndpoint: 'http://otel:4318' } },
    });
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
