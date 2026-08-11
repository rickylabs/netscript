import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { join } from '@std/path';
import { defineConfig } from '@netscript/config';

import { loadRegisteredPlugins } from '../../../../kernel/adapters/config/plugin-registry.ts';
import { probeConfiguredPluginManifest } from '../../../../kernel/adapters/config/configured-plugin-manifest-probe.ts';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { DenoProcess } from '../../../../kernel/adapters/runtime/process/deno-process.ts';
import { RemoteError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import type { RegisteredPluginConfig } from '../../../../kernel/domain/resolved-config.ts';
import { createDoctorPluginCommand } from './doctor-plugin-command.ts';
import {
  CONFIGURED_MODULE_EXPORTS_MANIFEST_CHECK,
  CONFIGURED_MODULE_RESOLVES_CHECK,
  doctorPlugin,
  type PluginDoctorReport,
  SERVICE_ENTRYPOINT_RESOLVES_CHECK,
} from './doctor-plugin-use-case.ts';

const MANIFEST_SOURCE = `
const manifest = {
  name: '@example/plugin-fixture',
  version: '1.0.0',
  contributions: {},
};
`;

Deno.test('plugin doctor reports all three host invariants healthy for a valid install', async () => {
  await withProject(async (projectRoot) => {
    await writeModule(projectRoot, `${MANIFEST_SOURCE}\nexport default manifest;\n`);
    await Deno.writeTextFile(join(projectRoot, 'extension', 'service.ts'), 'export {};\n');
    await writeAppsettings(projectRoot, 'extension/service.ts', '.');

    const reports = await runDoctor(projectRoot);
    const checks = reports[0].checks;
    assertEquals(findCheck(checks, CONFIGURED_MODULE_RESOLVES_CHECK).status, 'healthy');
    assertEquals(findCheck(checks, CONFIGURED_MODULE_EXPORTS_MANIFEST_CHECK).status, 'healthy');
    assertEquals(findCheck(checks, SERVICE_ENTRYPOINT_RESOLVES_CHECK).status, 'healthy');
  });
});

Deno.test('plugin doctor rejects a dangling configured module', async () => {
  await withProject(async (projectRoot) => {
    const reports = await runDoctor(projectRoot);
    const check = findCheck(reports[0].checks, CONFIGURED_MODULE_RESOLVES_CHECK);
    assertEquals(check.status, 'error');
    assertStringIncludes(check.message ?? '', 'does not exist');
    await assertDoctorCommandExitsOne(
      projectRoot,
      reports,
      CONFIGURED_MODULE_RESOLVES_CHECK,
    );
  });
});

Deno.test('plugin doctor rejects a configured module with no manifest export', async () => {
  await withProject(async (projectRoot) => {
    await writeModule(projectRoot, 'export const value = 1;\n');
    const reports = await runDoctor(projectRoot);
    const check = findCheck(reports[0].checks, CONFIGURED_MODULE_EXPORTS_MANIFEST_CHECK);
    assertEquals(check.status, 'error');
    assertStringIncludes(check.message ?? '', 'no manifest-shaped value');
    await assertDoctorCommandExitsOne(
      projectRoot,
      reports,
      CONFIGURED_MODULE_EXPORTS_MANIFEST_CHECK,
    );
  });
});

Deno.test('plugin doctor distinguishes a configured module import failure', async () => {
  await withProject(async (projectRoot) => {
    await writeModule(projectRoot, 'throw new Error("fixture import exploded");\n');
    const reports = await runDoctor(projectRoot);
    const check = findCheck(reports[0].checks, CONFIGURED_MODULE_EXPORTS_MANIFEST_CHECK);
    assertEquals(check.status, 'error');
    assertStringIncludes(check.message ?? '', 'failed to import');
    assertStringIncludes(check.message ?? '', 'fixture import exploded');
  });
});

Deno.test('plugin doctor kills and reports a configured module that times out', async () => {
  await withProject(async (projectRoot) => {
    await writeModule(
      projectRoot,
      'setInterval(() => {}, 1_000);\nawait new Promise<void>(() => {});\n',
    );
    const reports = await runDoctor(projectRoot, 50);
    const check = findCheck(reports[0].checks, CONFIGURED_MODULE_EXPORTS_MANIFEST_CHECK);
    assertEquals(check.status, 'error');
    assertStringIncludes(check.message ?? '', 'timed out after 50ms');
  });
});

Deno.test('plugin doctor distinguishes a configured module non-zero exit', async () => {
  await withProject(async (projectRoot) => {
    await writeModule(projectRoot, 'Deno.exit(9);\n');
    const reports = await runDoctor(projectRoot);
    const check = findCheck(reports[0].checks, CONFIGURED_MODULE_EXPORTS_MANIFEST_CHECK);
    assertEquals(check.status, 'error');
    assertStringIncludes(check.message ?? '', 'exited non-zero (9)');
  });
});

Deno.test('plugin doctor rejects a service entrypoint absent from a JSR export map', async () => {
  await withProject(async (projectRoot) => {
    await writeModule(projectRoot, `${MANIFEST_SOURCE}\nexport default manifest;\n`);
    await writeAppsettings(projectRoot, 'jsr:@example/plugin-fixture@1.0.0/services', '.');
    const reports = await runDoctor(projectRoot, undefined, () => Promise.resolve(new Set(['.'])));
    const check = findCheck(reports[0].checks, SERVICE_ENTRYPOINT_RESOLVES_CHECK);
    assertEquals(check.status, 'error');
    assertStringIncludes(check.message ?? '', 'is not declared');
    await assertDoctorCommandExitsOne(
      projectRoot,
      reports,
      SERVICE_ENTRYPOINT_RESOLVES_CHECK,
    );
  });
});

Deno.test('doctor subprocess and runtime loader have manifest-resolution parity', async () => {
  const cases = [
    {
      name: 'default wins with additional named manifests',
      source: `${MANIFEST_SOURCE}\nexport default manifest;\nexport const alternate = { ...manifest, name: '@example/plugin-alternate' };\n`,
      resolves: true,
    },
    {
      name: 'sole named manifest',
      source: `${MANIFEST_SOURCE}\nexport { manifest };\n`,
      resolves: true,
    },
    { name: 'no manifest', source: 'export const value = 1;\n', resolves: false },
    {
      name: 'ambiguous named manifests',
      source: `${MANIFEST_SOURCE}\nexport { manifest };\nexport const alternate = { ...manifest, name: '@example/plugin-alternate' };\n`,
      resolves: false,
    },
  ];

  for (const fixture of cases) {
    await withProject(async (projectRoot) => {
      await writeModule(projectRoot, fixture.source);
      const config = projectConfig();
      let loaderResolved = true;
      try {
        await loadRegisteredPlugins(projectRoot, config);
      } catch {
        loaderResolved = false;
      }
      const probe = await probeConfiguredPluginManifest(
        projectRoot,
        config.plugins[0],
        new DenoProcess(),
      );
      assertEquals(
        { loaderResolved, doctorResolved: probe.status === 'resolved' },
        { loaderResolved: fixture.resolves, doctorResolved: fixture.resolves },
        fixture.name,
      );
    });
  }
});

async function runDoctor(
  projectRoot: string,
  timeoutMs?: number,
  loadJsrExportMap?: (
    packageSpecifier: string,
    version: string,
  ) => Promise<ReadonlySet<string>>,
) {
  const config = projectConfig();
  return await doctorPlugin({ projectRoot }, {
    fs: new DenoFileSystem(),
    process: new DenoProcess(),
    configuredModuleTimeoutMs: timeoutMs,
    loadJsrExportMap,
    loadConfig: () => Promise.resolve(config),
    loadRegisteredPlugins: () => Promise.resolve({ fixture: registeredPlugin(projectRoot) }),
  });
}

function projectConfig() {
  return defineConfig({
    name: 'doctor-fixture',
    databases: { config: [] },
    plugins: ['./extension/plugin.ts'],
  });
}

function registeredPlugin(projectRoot: string): RegisteredPluginConfig {
  return {
    name: '@example/plugin-fixture',
    displayName: 'Fixture',
    workdir: 'extension',
    rootDir: join(projectRoot, 'extension'),
    permissions: ['--allow-read'],
  };
}

async function writeModule(projectRoot: string, source: string): Promise<void> {
  await Deno.mkdir(join(projectRoot, 'extension'), { recursive: true });
  await Deno.writeTextFile(join(projectRoot, 'extension', 'plugin.ts'), source);
}

async function writeAppsettings(
  projectRoot: string,
  entrypoint: string,
  workdir: string,
): Promise<void> {
  await Deno.writeTextFile(join(projectRoot, 'appsettings.json'), JSON.stringify({
    NetScript: {
      Plugins: {
        fixture: { Entrypoint: entrypoint, Workdir: workdir },
      },
    },
  }));
}

function findCheck(
  checks: readonly { readonly id: string; readonly status: string; readonly message?: string }[],
  id: string,
) {
  const result = checks.find((check) => check.id === id);
  if (!result) throw new Error(`Missing doctor check ${id}.`);
  return result;
}

async function assertDoctorCommandExitsOne(
  projectRoot: string,
  reports: readonly PluginDoctorReport[],
  checkId: string,
): Promise<void> {
  const command = createDoctorPluginCommand({
    resolveProjectRoot: () => Promise.resolve(projectRoot),
    doctor: () => Promise.resolve(reports),
    print: () => {},
    diagnosticEvidence: () => ({
      read: () => Promise.resolve(undefined),
      write: () => Promise.resolve(),
      appendDrift: () => Promise.resolve(),
    }),
  });
  const error = await assertRejects(
    () => command.parse(['--project-root', projectRoot]),
    RemoteError,
  );
  assertEquals(error.exitCode, 1, `${checkId} must fail the doctor command`);
}

async function withProject(run: (projectRoot: string) => Promise<void>): Promise<void> {
  const projectRoot = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(join(projectRoot, 'deno.json'), '{"compilerOptions":{"strict":true}}');
    await run(projectRoot);
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
}
