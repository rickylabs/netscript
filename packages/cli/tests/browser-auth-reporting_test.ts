import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { join } from '@std/path';
import type { DoctorReport } from '@netscript/plugin/adapter';
import { reconcileBrowserAuth } from '../src/kernel/adapters/plugin/browser-auth-reconciler.ts';
import { MemoryFileSystemAdapter } from '../src/kernel/adapters/scaffold/memory-fs.ts';
import { DenoGeneratedSourceFormatter } from '../src/kernel/adapters/runtime/process/deno-generated-source-formatter.ts';
import { DenoProcess } from '../src/kernel/adapters/runtime/process/deno-process.ts';
import { renderDoctorReport } from '../src/kernel/presentation/output/render-doctor-report.ts';
import { writeInstalledAuthFixture } from './installed-auth-fixture.ts';

const ROOT = '/workspace';
const PATHS = [
  'auth/bff.ts',
  'auth/service.ts',
  'apps/web/routes/auth/[action].ts',
  'apps/web/routes/examples/users/session.ts',
];

async function fixture(authored = false) {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    join(ROOT, 'appsettings.json'),
    JSON.stringify({
      NetScript: {
        Apps: {
          web: { Type: 'app', Auth: { BrowserTopology: authored ? 'authored' : 'scaffold' } },
        },
        Services: { users: {} },
      },
    }),
  );
  await fs.writeFile(join(ROOT, 'apps/web/utils.ts'), 'export {};\n');
  await fs.writeFile(
    join(ROOT, 'contracts/versions/v1/users.contract.ts'),
    'export const UsersContractV1 = { session: baseContract };',
  );
  await writeInstalledAuthFixture(fs, ROOT);
  return fs;
}

function messages(report: DoctorReport): string[] {
  const lines: string[] = [];
  renderDoctorReport(report, (line) => lines.push(line));
  return lines;
}

Deno.test('browser-auth reporting: fresh project emits files without findings', async () => {
  const fs = await fixture();
  const result = await reconcileBrowserAuth(ROOT, fs);
  assertEquals(result.written, PATHS.map((path) => join(ROOT, path)));
  assertEquals(result.report, { plugin: 'browser-auth', checks: [] });
  assertEquals(messages(result.report), []);
  for (const path of PATHS) assert(await fs.exists(join(ROOT, path)));
});

Deno.test('browser-auth reporting: authored topology reports absent and present skips without writes', async () => {
  for (const present of [false, true]) {
    const fs = await fixture(true);
    if (present) {
      for (const path of PATHS) await fs.writeFile(join(ROOT, path), `// authored ${path}\n`);
    }
    // Settings are already canonical so the observation includes every filesystem write.
    const settingsPath = join(ROOT, 'appsettings.json');
    await fs.writeFile(
      settingsPath,
      JSON.stringify(JSON.parse(await fs.readFile(settingsPath)), null, 2) + '\n',
    );
    const before = new Map(fs.getFiles());
    const result = await reconcileBrowserAuth(ROOT, fs);
    assertEquals(result.written, []);
    assertEquals(new Map(fs.getFiles()), before);
    assertEquals(result.report.checks.map((check) => check.name), PATHS);
    assert(result.report.checks.every((check) => check.ok));
    const lines = messages(result.report);
    assertEquals(lines.length, PATHS.length);
    for (const [index, check] of result.report.checks.entries()) {
      assertEquals(check.ok, true);
      assertStringIncludes(check.message ?? '', 'Skipped (authored topology)');
      assertEquals(check.message?.includes('divergent'), present);
      assertStringIncludes(lines[index], PATHS[index]);
      assertStringIncludes(lines[index], 'Skipped (authored topology)');
    }
    // The same existing report is safe to serialize, without operational root paths.
    assertEquals(JSON.parse(JSON.stringify(result.report)), result.report);
    assertEquals(JSON.stringify(result.report).includes(ROOT), false);
  }
});

Deno.test('browser-auth reporting: canonical generator-owned rerun is silent and byte-idempotent', async () => {
  const fs = await fixture();
  const formatter = new DenoGeneratedSourceFormatter(new DenoProcess());
  await reconcileBrowserAuth(ROOT, fs, formatter);
  const before = new Map(fs.getFiles());
  const result = await reconcileBrowserAuth(ROOT, fs, formatter);
  assertEquals(result.written, []);
  assertEquals(result.report, { plugin: 'browser-auth', checks: [] });
  assertEquals(messages(result.report), []);
  assertEquals(new Map(fs.getFiles()), before);
});

Deno.test('browser-auth reporting: each divergent file is informational in structured and human output and preserved', async () => {
  const fs = await fixture();
  await reconcileBrowserAuth(ROOT, fs);
  for (const path of PATHS) await fs.writeFile(join(ROOT, path), `// custom ${path}\n`);
  const before = new Map(fs.getFiles());
  const result = await reconcileBrowserAuth(ROOT, fs);
  assertEquals(result.written, []);
  assertEquals(new Map(fs.getFiles()), before);
  assertEquals(result.report.checks.map((check) => check.name), PATHS);
  assert(result.report.checks.every((check) => check.ok));
  const lines = messages(result.report);
  assertEquals(lines.length, PATHS.length);
  for (const [index, check] of result.report.checks.entries()) {
    assertEquals(check.ok, true);
    assertStringIncludes(check.message ?? '', 'Skipped (already present)');
    assertStringIncludes(check.message ?? '', 'divergent from current generator output');
    assertStringIncludes(lines[index], PATHS[index]);
    assertStringIncludes(lines[index], 'divergent');
  }
  assertEquals(JSON.parse(JSON.stringify(result.report)), result.report);
});

Deno.test('browser-auth reporting: mixed ownership reports only authored routes and divergent shared helpers', async () => {
  const fs = await fixture(true);
  const settingsPath = join(ROOT, 'appsettings.json');
  const settings = JSON.parse(await fs.readFile(settingsPath));
  settings.NetScript.Apps.admin = { Type: 'app', Workdir: 'apps/admin' };
  await fs.writeFile(settingsPath, JSON.stringify(settings));
  await fs.writeFile(join(ROOT, 'apps/admin/utils.ts'), '');
  await fs.writeFile(join(ROOT, 'auth/bff.ts'), '// shared authored helper\n');
  const result = await reconcileBrowserAuth(ROOT, fs);
  assertEquals(result.report.checks.map((check) => check.name), [PATHS[0], PATHS[2], PATHS[3]]);
  assertStringIncludes(result.report.checks[0].message ?? '', 'already present');
  assertStringIncludes(result.report.checks[1].message ?? '', 'authored topology');
  assert(await fs.exists(join(ROOT, 'apps/admin/routes/auth/[action].ts')));
  assertEquals(await fs.exists(join(ROOT, PATHS[2])), false);
  assertEquals(await fs.readFile(join(ROOT, PATHS[0])), '// shared authored helper\n');
});

Deno.test('authored browser layouts outside generated resource directories remain informational', async () => {
  for (const workdir of ['../external', '.']) {
    const fs = await fixture(true);
    const settingsPath = join(ROOT, 'appsettings.json');
    const settings = JSON.parse(await fs.readFile(settingsPath));
    settings.NetScript.Apps.web.Workdir = workdir;
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2) + '\n');
    const route = join(ROOT, workdir, 'routes/auth/[action].ts');
    await fs.writeFile(route, '// external authored route\n');
    const before = new Map(fs.getFiles());
    const readFile = fs.readFile.bind(fs);
    const exists = fs.exists.bind(fs);
    // Fail on any attempt to inspect the out-of-layout authored route.
    fs.readFile = (path) => {
      assert(path !== route);
      return readFile(path);
    };
    fs.exists = (path) => {
      assert(path !== route);
      return exists(path);
    };
    for (let run = 0; run < 2; run++) {
      const result = await reconcileBrowserAuth(ROOT, fs);
      assertEquals(result.written, []);
      assertEquals(new Map(fs.getFiles()), before);
      assertEquals(result.report.checks.length, 4);
      assert(result.report.checks.every((check) => check.ok));
      const uninspected = result.report.checks.filter((check) =>
        check.message?.includes('not inspected')
      );
      assertEquals(uninspected.length, 2);
      assertStringIncludes(uninspected[0].name, 'routes/auth/[action].ts');
      assertStringIncludes(uninspected[1].name, 'routes/examples/users/session.ts');
    }
  }
});
