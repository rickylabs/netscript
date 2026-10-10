import { assertEquals, assertStringIncludes } from '@std/assert';
import { ProjectWiringDoctorFamily } from '../src/infrastructure/project-wiring-doctor-family.ts';

const sources = [
  ['auth-only configuration', 'export default { plugins: [authPlugin] };'],
  ['explicitly empty plugin list', 'export default { plugins: [] };'],
  ['plugin key only in a comment', '// plugins: [workersPlugin]\nexport default {};'],
  ['workers configuration with missing registry', 'export default { plugins: [workersPlugin] };'],
  ['configuration without a plugin key', 'export default {};'],
] as const;

for (const [scenario, source] of sources) {
  Deno.test(`project registry warns without an ineffective remedy: ${scenario}`, async () => {
    const root = await Deno.makeTempDir();
    try {
      await Deno.writeTextFile(`${root}/deno.json`, '{}');
      await Deno.writeTextFile(`${root}/netscript.config.ts`, source);
      const family = new ProjectWiringDoctorFamily();
      const inspect = async () => {
        const checks = await family.check({ projectRoot: root, explicitTelemetryEndpoint: false });
        return checks.find((check) => check.name === 'plugin_registry');
      };
      const absentDirectory = await inspect();
      assertEquals(absentDirectory?.status, 'warn');
      assertStringIncludes(absentDirectory?.summary ?? '', 'expected registry set is unknown');
      assertStringIncludes(absentDirectory?.summary ?? '', 'legitimately generate no files');
      assertEquals(absentDirectory?.fix, undefined);

      await Deno.mkdir(`${root}/.netscript/generated`, { recursive: true });
      await Deno.writeTextFile(`${root}/.netscript/generated/unrelated.ts`, 'export {};');
      assertEquals(await inspect(), absentDirectory);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });
}

Deno.test('project registry inspects generated files without reading config source', async () => {
  const reads: string[] = [];
  const family = new ProjectWiringDoctorFamily({
    exists: (path) => Promise.resolve(!path.endsWith('/docs/site')),
    readText: (path) => {
      reads.push(path);
      if (!path.endsWith('/deno.json')) throw new Error('Config source must not be read');
      return Promise.resolve('{}');
    },
    listFiles: () => Promise.resolve(['workers.registry.ts']),
  });
  const checks = await family.check({ projectRoot: '/fixture', explicitTelemetryEndpoint: false });
  assertEquals(reads, ['/fixture/deno.json']);
  assertEquals(checks.find((check) => check.name === 'plugin_registry'), {
    name: 'plugin_registry',
    status: 'pass',
    summary: 'Generated plugin registries are present (1 module(s)).',
  });
});
