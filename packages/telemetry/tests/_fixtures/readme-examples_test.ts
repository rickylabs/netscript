import { assertEquals, assertStringIncludes } from '@std/assert';
import { inspectTelemetry, InstrumentationRegistry } from '../../mod.ts';

Deno.test('README registry inspection example returns a diagnostic report', () => {
  const registry = new InstrumentationRegistry();
  registry.register({ name: 'queue' });

  const report = inspectTelemetry(registry);

  assertEquals(report.package, '@netscript/telemetry');
  assertStringIncludes(report.summary, 'registry');
});
