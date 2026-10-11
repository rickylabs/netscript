import { assertEquals, assertStringIncludes } from '@std/assert';
import schema from '../../../../assets/schema/aspire-generated-surface.v1.json' with {
  type: 'json',
};
import { checkAspireSurface } from './aspire-surface-checker.ts';

Deno.test('inspection failure preserves the cause and schema v1 permits an optional message', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(`${root}/appsettings.json`, '{}');
    const report = await checkAspireSurface(root, () => {
      throw new Error('Formatter failed: invalid syntax');
    });
    assertEquals(report.status, 'inspection-failure');
    assertEquals(report.drift[0].message, 'Formatter failed: invalid syntax');
    const entry = schema.properties.drift.items;
    assertEquals(entry.additionalProperties, false);
    assertEquals(entry.properties.message, { type: 'string' });
    assertEquals(entry.required.includes('message'), false);
    assertEquals(Object.keys(report.drift[0]).every((key) => key in entry.properties), true);
    const missing = await checkAspireSurface(root, () => Promise.reject('Probe unavailable'));
    assertStringIncludes(missing.drift[0].message ?? '', 'Probe unavailable');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
