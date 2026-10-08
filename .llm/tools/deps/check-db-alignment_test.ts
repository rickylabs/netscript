import { assertEquals } from '@std/assert';
import { analyzeDbGraph } from './check-db-alignment.ts';

Deno.test('DB guard requires one complete Collection identity and a resolved graph', () => {
  const core = '@tanstack/db@0.6.17_typescript@7.0.2';
  assertEquals(analyzeDbGraph({ npmPackages: { [core]: {} } }).findings, []);
  for (
    const other of [
      '@tanstack/db@0.7.0_typescript@7.0.2',
      '@tanstack/db@0.6.17_typescript@6.0.2',
    ]
  ) {
    assertEquals(analyzeDbGraph({ npmPackages: { [core]: {}, [other]: {} } }).findings.length, 1);
  }
  assertEquals(analyzeDbGraph({ npmPackages: {} }).findings.length, 1);
  assertEquals(
    analyzeDbGraph({ npmPackages: { [core]: {} }, modules: [{ error: 'not resolved' }] })
      .findings.length,
    1,
  );
});
