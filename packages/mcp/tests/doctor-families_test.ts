import { assertEquals, assertStringIncludes } from '@std/assert';
import { AspireDoctorFamily } from '../src/infrastructure/aspire-doctor-family.ts';
import {
  PluginDoctorFamily,
  UnwiredProjectDoctor,
} from '../src/infrastructure/plugin-doctor-family.ts';
import { ProjectWiringDoctorFamily } from '../src/infrastructure/project-wiring-doctor-family.ts';
import type { DoctorCheckContext } from '../mod.ts';

const fixtureRoot = new URL('./fixtures/doctor/', import.meta.url).pathname;
const context = (projectRoot: string): DoctorCheckContext => ({
  projectRoot,
  explicitTelemetryEndpoint: false,
});

Deno.test('project family passes valid workspace and generated plugin registry fixtures', async () => {
  const checks = await new ProjectWiringDoctorFamily().check(context(`${fixtureRoot}healthy`));
  assertEquals(checks.map((check) => [check.name, check.status]), [
    ['deno_workspace', 'pass'],
    ['plugin_registry', 'pass'],
    ['docs_root', 'pass'],
  ]);
  assertStringIncludes(checks[1]?.summary ?? '', '3 module(s)');
});

Deno.test('project family fails invalid workspace and missing generated registry fixtures', async () => {
  const checks = await new ProjectWiringDoctorFamily().check(context(`${fixtureRoot}broken`));
  assertEquals(checks.map((check) => [check.name, check.status]), [
    ['deno_workspace', 'fail'],
    ['plugin_registry', 'fail'],
    ['docs_root', 'pass'],
  ]);
});

Deno.test('Aspire family maps the upstream inspection report through injected fixture ports', async () => {
  const family = new AspireDoctorFamily({
    exists: (path) => Promise.resolve(path.endsWith('/aspire/apphost.ts')),
    inspect: (target) => ({
      package: '@netscript/aspire',
      target,
      summary: 'fixture graph',
      details: { kind: 'path' },
    }),
  });
  const checks = await family.check(context('/fixture'));
  assertEquals(checks[0]?.status, 'pass');
  assertStringIncludes(checks[0]?.summary ?? '', 'fixture graph');
});

Deno.test('plugin family exposes the S7 injection seam as a warning', async () => {
  const checks = await new PluginDoctorFamily(new UnwiredProjectDoctor()).check(
    context('/fixture'),
  );
  assertEquals(checks[0]?.status, 'warn');
  assertStringIncludes(checks[0]?.summary ?? '', 'not wired');
});
