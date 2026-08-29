import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { dirname, fromFileUrl, join, toFileUrl } from '@std/path';
import { defineConfig } from '@netscript/config';

import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { DenoProcess } from '../../../../kernel/adapters/runtime/process/deno-process.ts';
import { RemoteError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import { SCAFFOLD_WORKSPACE_CATALOG } from '../../../../kernel/constants/scaffold/scaffold-app-catalog.ts';
import {
  netscriptJsrSpecifier,
} from '../../../../kernel/constants/jsr-specifiers.ts';
import type { DiagnosticEvidencePort } from '@netscript/mcp';
import { createInstalledRuntimeRegistryGenerator } from '../../generate/plugins/installed-runtime-registry-generator.ts';
import { createDoctorPluginCommand } from './doctor-plugin-command.ts';
import {
  doctorPlugin,
  type PluginDoctorDependencies,
} from './doctor-plugin-use-case.ts';

const REPOSITORY_ROOT = fromFileUrl(new URL('../../../../../../..', import.meta.url));

const NOOP_EVIDENCE: DiagnosticEvidencePort = {
  read: () => Promise.resolve(undefined),
  write: () => Promise.resolve(),
  appendDrift: () => Promise.resolve(),
};

Deno.test('plugin doctor fails when a saga is authored after generate plugins', async () => {
  const projectRoot = await Deno.makeTempDir({ prefix: 'netscript-doctor-registry-drift-' });
  try {
    await writeProject(projectRoot);
    await writeSaga(projectRoot, 'registered-saga');

    const fs = new DenoFileSystem();
    const generate = createInstalledRuntimeRegistryGenerator({
      fs,
      process: new DenoProcess(),
      fetchManifest: () => Promise.reject(new Error('workspace manifest must win')),
    });
    await generate({ dryRun: false, projectRoot });

    await writeSaga(projectRoot, 'late-saga');

    const output: string[] = [];
    const dependencies = {
      fs,
      process: new DenoProcess(),
      loadConfig: () => Promise.resolve(defineConfig({
        name: 'registry-drift-fixture',
        databases: { config: [] },
        plugins: [],
      })),
      loadJsrExportMap: () => Promise.resolve(new Set(['./services'])),
      inspectRuntimeRegistries: (root: string) =>
        generate({ dryRun: true, projectRoot: root }),
    } as PluginDoctorDependencies;
    const command = createDoctorPluginCommand({
      resolveProjectRoot: () => Promise.resolve(projectRoot),
      doctor: (input) => doctorPlugin(input, dependencies),
      diagnosticEvidence: () => NOOP_EVIDENCE,
      print: (line) => output.push(line),
    });

    const error = await assertRejects(
      () => command.parse(['--project-root', projectRoot]),
      RemoteError,
    );
    assertEquals(error.exitCode, 1);
    assertStringIncludes(output.join('\n'), 'sagas/late-saga.ts');
    assertStringIncludes(output.join('\n'), 'netscript generate plugins');
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});

async function writeProject(projectRoot: string): Promise<void> {
  const rootConfig = JSON.parse(await Deno.readTextFile(join(REPOSITORY_ROOT, 'deno.json'))) as {
    readonly imports: Readonly<Record<string, string>>;
  };
  await write(join(projectRoot, 'deno.json'), `${JSON.stringify({
    catalog: SCAFFOLD_WORKSPACE_CATALOG,
    imports: {
      ...rootConfig.imports,
      '@netscript/plugin/cli': toFileUrl(
        join(REPOSITORY_ROOT, 'packages/plugin/src/cli/mod.ts'),
      ).href,
      '@netscript/plugin-sagas/runtime': toFileUrl(
        join(REPOSITORY_ROOT, 'plugins/sagas/src/runtime/mod.ts'),
      ).href,
    },
  })}\n`);
  await write(join(projectRoot, 'appsettings.json'), `${JSON.stringify({
    NetScript: {
      Plugins: {
        sagas: {
          Entrypoint: netscriptJsrSpecifier('plugin-sagas', '/services'),
        },
      },
    },
  })}\n`);
}

async function writeSaga(projectRoot: string, id: string): Promise<void> {
  await write(join(projectRoot, 'sagas', `${id}.ts`), `
function defineSaga(sagaId: string) {
  return {
    id: sagaId,
    durability: 't1',
    initialState: {},
    handledMessageTypes: [],
    handlers: new Map(),
  };
}
export default defineSaga('${id}');
`);
}

async function write(path: string, text: string): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, text);
}
