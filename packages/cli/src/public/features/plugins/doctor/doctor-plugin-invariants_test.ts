import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { join } from '@std/path';
import { defineConfig } from '@netscript/config';

import {
  loadRegisteredPluginMetadata,
  loadRegisteredPlugins,
} from '../../../../kernel/adapters/config/plugin-registry.ts';
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
import { JsrExportMapHttpError } from './jsr-export-map-loader-port.ts';

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

Deno.test('plugin doctor reports an exact unpublished service entrypoint as a named exclusion', async () => {
  await withProject(async (projectRoot) => {
    await writeModule(projectRoot, `${MANIFEST_SOURCE}\nexport default manifest;\n`);
    await writeAppsettings(
      projectRoot,
      'jsr:@example/plugin-fixture@0.0.6-unpublished/services',
      '.',
    );
    const requested: string[] = [];
    const reports = await runDoctor(projectRoot, undefined, (packageSpecifier, version) => {
      requested.push(`${packageSpecifier}@${version}`);
      return Promise.reject(registryHttpError(404));
    });
    const check = findCheck(reports[0].checks, SERVICE_ENTRYPOINT_RESOLVES_CHECK);
    assertEquals(requested, ['@example/plugin-fixture@0.0.6-unpublished']);
    assertEquals(check.status, 'warning');
    assertStringIncludes(check.message ?? '', 'Excluded');
    assertStringIncludes(check.message ?? '', '@example/plugin-fixture@0.0.6-unpublished');
    await assertDoctorCommandSucceeds(projectRoot, reports);
  });
});

Deno.test('plugin doctor fully checks a published service entrypoint and rejects a missing export', async () => {
  await withProject(async (projectRoot) => {
    await writeModule(projectRoot, `${MANIFEST_SOURCE}\nexport default manifest;\n`);
    await writeAppsettings(projectRoot, 'jsr:@example/plugin-fixture@1.0.0/services', '.');
    const requested: string[] = [];
    const reports = await runDoctor(projectRoot, undefined, (packageSpecifier, version) => {
      requested.push(`${packageSpecifier}@${version}`);
      return Promise.resolve(new Set(['.']));
    });
    const check = findCheck(reports[0].checks, SERVICE_ENTRYPOINT_RESOLVES_CHECK);
    assertEquals(requested, ['@example/plugin-fixture@1.0.0']);
    assertEquals(check.status, 'error');
    assertStringIncludes(check.message ?? '', 'is not declared');
    await assertDoctorCommandExitsOne(
      projectRoot,
      reports,
      SERVICE_ENTRYPOINT_RESOLVES_CHECK,
    );
  });
});

Deno.test('plugin doctor keeps a non-404 service entrypoint registry failure hard', async () => {
  await withProject(async (projectRoot) => {
    await writeModule(projectRoot, `${MANIFEST_SOURCE}\nexport default manifest;\n`);
    await writeAppsettings(projectRoot, 'jsr:@example/plugin-fixture@1.0.0/services', '.');
    const reports = await runDoctor(
      projectRoot,
      undefined,
      () => Promise.reject(registryHttpError(503)),
    );
    const check = findCheck(reports[0].checks, SERVICE_ENTRYPOINT_RESOLVES_CHECK);
    assertEquals(check.status, 'error');
    assertStringIncludes(check.message ?? '', 'HTTP 503');
    await assertDoctorCommandExitsOne(
      projectRoot,
      reports,
      SERVICE_ENTRYPOINT_RESOLVES_CHECK,
    );
  });
});

Deno.test('plugin doctor warns when an explicit permission override differs from manifest truth', async () => {
  await withProject(async (projectRoot) => {
    await writeModule(projectRoot, `${MANIFEST_SOURCE}\nexport default manifest;\n`);
    await Deno.writeTextFile(join(projectRoot, 'extension/service.ts'), 'export {};\n');
    await Deno.writeTextFile(join(projectRoot, 'appsettings.json'), JSON.stringify({
      NetScript: {
        Plugins: {
          fixture: {
            Entrypoint: 'extension/service.ts',
            Workdir: '.',
            Permissions: ['--allow-net'],
          },
        },
      },
    }));
    const reports = await runDoctor(projectRoot);
    const permission = findCheck(reports[0].checks, 'permissions');
    assertEquals(permission.status, 'warning');
    assertStringIncludes(permission.message ?? '', '--allow-net');
    assertStringIncludes(permission.message ?? '', 'published default: --allow-read');
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

Deno.test('plugin doctor treats a bare package alias as package-backed despite an incidental directory', async () => {
  await withProject(async (projectRoot) => {
    await Deno.mkdir(join(projectRoot, 'package'), { recursive: true });
    await Deno.writeTextFile(
      join(projectRoot, 'package/plugin.ts'),
      `${MANIFEST_SOURCE.replace('contributions: {},', "permissions: ['--allow-read'],\n  contributions: {},")}
export default manifest;
`,
    );
    await Deno.mkdir(join(projectRoot, 'plugins/fixture'), { recursive: true });
    await Deno.writeTextFile(
      join(projectRoot, 'deno.json'),
      JSON.stringify({ imports: { '@example/plugin-fixture': './package/plugin.ts' } }),
    );
    const config = defineConfig({
      name: 'doctor-fixture',
      databases: { config: [] },
      plugins: ['@example/plugin-fixture'],
    });
    const plugins = await loadRegisteredPluginMetadata(projectRoot, config);
    const reports = await doctorPlugin({ projectRoot }, {
      fs: new DenoFileSystem(),
      process: new DenoProcess(),
      loadConfig: () => Promise.resolve(config),
      loadRegisteredPlugins: () => Promise.resolve(plugins),
    });
    const fixture = reports.find((report) => report.pluginName === '@example/plugin-fixture');
    if (!fixture) throw new Error('Missing package-backed plugin report.');
    assertEquals(findCheck(fixture.checks, 'source').status, 'healthy');
    assertStringIncludes(findCheck(fixture.checks, 'source').message ?? '', 'Package-backed');
    assertEquals(fixture.checks.some((check) => check.id === 'workdir'), false);
    assertEquals(findCheck(fixture.checks, 'permissions').message, '--allow-read');
  });
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
    source: {
      kind: 'local-workdir',
      configuredSpecifier: './extension/plugin.ts',
      resolvedSpecifier: new URL(`file://${join(projectRoot, 'extension/plugin.ts')}`).href,
      workdir: 'extension',
      rootDir: join(projectRoot, 'extension'),
    },
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

async function assertDoctorCommandSucceeds(
  projectRoot: string,
  reports: readonly PluginDoctorReport[],
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
  await command.parse(['--project-root', projectRoot]);
}

function registryHttpError(status: number): JsrExportMapHttpError {
  return new JsrExportMapHttpError(status);
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
