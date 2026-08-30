import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { copy, walk } from '@std/fs';
import { dirname, fromFileUrl, join, relative, toFileUrl } from '@std/path';
import { defineConfig } from '@netscript/config';

import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { DenoProcess } from '../../../../kernel/adapters/runtime/process/deno-process.ts';
import { RemoteError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import { SCAFFOLD_WORKSPACE_CATALOG } from '../../../../kernel/constants/scaffold/scaffold-app-catalog.ts';
import { netscriptJsrSpecifier } from '../../../../kernel/constants/jsr-specifiers.ts';
import type { DiagnosticEvidencePort } from '@netscript/mcp';
import { createInstalledRuntimeRegistryGenerator } from '../../generate/plugins/installed-runtime-registry-generator.ts';
import type { GenerateInstalledPluginRegistries } from '../../generate/plugins/generate-installed-plugin-registries.ts';
import { createDoctorPluginCommand } from './doctor-plugin-command.ts';
import { doctorPlugin, type PluginDoctorDependencies } from './doctor-plugin-use-case.ts';

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

    const { command, output } = createDoctorHarness(projectRoot, fs, generate);

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

Deno.test('plugin doctor reports registry entries whose source was removed', async () => {
  const projectRoot = await Deno.makeTempDir({ prefix: 'netscript-doctor-registry-orphan-' });
  try {
    await writeProject(projectRoot);
    await writeSaga(projectRoot, 'registered-saga');
    await writeSaga(projectRoot, 'removed-saga');

    const fs = new DenoFileSystem();
    const generate = createGenerator(fs);
    await generate({ dryRun: false, projectRoot });
    await Deno.remove(join(projectRoot, 'sagas', 'removed-saga.ts'));

    const { command, output } = createDoctorHarness(projectRoot, fs, generate);
    await assertRejects(() => command.parse(['--project-root', projectRoot]), RemoteError);

    assertStringIncludes(output.join('\n'), 'sagas/removed-saga.ts');
    assertStringIncludes(output.join('\n'), 'no manifest-discovered source');
    assertStringIncludes(output.join('\n'), 'netscript generate plugins');
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});

Deno.test('plugin doctor does not count an imported-but-unused source as registered', async () => {
  const projectRoot = await Deno.makeTempDir({ prefix: 'netscript-doctor-registry-unused-' });
  try {
    await writeProject(projectRoot);
    await writeSaga(projectRoot, 'registered-saga');

    const fs = new DenoFileSystem();
    const generate = createGenerator(fs);
    await generate({ dryRun: false, projectRoot });
    await writeSaga(projectRoot, 'unused-saga');

    const registryPath = join(
      projectRoot,
      '.netscript/generated/plugin-sagas/sagas.registry.ts',
    );
    const registry = await fs.readFile(registryPath);
    await fs.writeFile(
      registryPath,
      `import unusedSaga from '../../../sagas/unused-saga.ts';\n${registry}`,
    );

    const { command, output } = createDoctorHarness(projectRoot, fs, generate);
    await assertRejects(() => command.parse(['--project-root', projectRoot]), RemoteError);

    assertStringIncludes(output.join('\n'), 'sagas/unused-saga.ts');
    assertStringIncludes(output.join('\n'), 'Missing generated entry');
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});

Deno.test('plugin doctor names the exact healthy manifest-backed registry evidence', async () => {
  const projectRoot = await Deno.makeTempDir({ prefix: 'netscript-doctor-registry-aligned-' });
  try {
    await writeProject(projectRoot);
    await writeSaga(projectRoot, 'registered-saga');

    const fs = new DenoFileSystem();
    const generate = createGenerator(fs);
    await generate({ dryRun: false, projectRoot });

    const { command, output } = createDoctorHarness(projectRoot, fs, generate);
    await command.parse(['--project-root', projectRoot]);

    const text = output.join('\n');
    assertStringIncludes(text, '.netscript/generated/plugin-sagas/sagas.registry.ts');
    assertStringIncludes(text, '1 manifest-declared source file: sagas/registered-saga.ts');
    assertStringIncludes(text, 'no non-registry runtime topology was verified');
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});

Deno.test('plugin doctor bounds healthy output when no runtime registry target exists', async () => {
  const projectRoot = await Deno.makeTempDir({ prefix: 'netscript-doctor-registry-none-' });
  try {
    await writeProjectConfig(projectRoot);
    const fs = new DenoFileSystem();
    const generate = createGenerator(fs);
    const { command, output } = createDoctorHarness(projectRoot, fs, generate);

    await command.parse(['--project-root', projectRoot]);

    const text = output.join('\n');
    assertStringIncludes(text, 'No manifest-declared runtime registry targets were discovered');
    assertStringIncludes(text, 'no non-registry runtime topology was verified');
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});

Deno.test('plugin doctor stays healthy when AI generation excludes the skill-loader factory', async () => {
  const projectRoot = await Deno.makeTempDir({ prefix: 'netscript-doctor-registry-ai-' });
  try {
    await writeAiProject(projectRoot);

    const fs = new DenoFileSystem();
    const generate = createGenerator(fs);
    await generate({ dryRun: false, projectRoot });

    const toolsRegistry = await fs.readFile(
      join(projectRoot, '.netscript/generated/plugin-ai/tools.registry.ts'),
    );
    assertEquals(toolsRegistry.includes('ai/tools/skill-loader.ts'), false);
    const beforeDoctor = await snapshotProjectFiles(projectRoot);

    const { command, output } = createDoctorHarness(projectRoot, fs, generate);
    await command.parse(['--project-root', projectRoot]);

    assertStringIncludes(output.join('\n'), 'ai/tools/e2e-tool.ts');
    assertStringIncludes(output.join('\n'), 'generator-selected source file');
    assertEquals(await snapshotProjectFiles(projectRoot), beforeDoctor);
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});

function createGenerator(fs: DenoFileSystem): GenerateInstalledPluginRegistries {
  return createInstalledRuntimeRegistryGenerator({
    fs,
    process: new DenoProcess(),
    fetchManifest: () => Promise.reject(new Error('workspace manifest must win')),
  });
}

function createDoctorHarness(
  projectRoot: string,
  fs: DenoFileSystem,
  generate: GenerateInstalledPluginRegistries,
): {
  readonly command: ReturnType<typeof createDoctorPluginCommand>;
  readonly output: string[];
} {
  const output: string[] = [];
  const dependencies: PluginDoctorDependencies = {
    fs,
    process: new DenoProcess(),
    loadConfig: () =>
      Promise.resolve(defineConfig({
        name: 'registry-drift-fixture',
        databases: { config: [] },
        plugins: [],
      })),
    loadJsrExportMap: () => Promise.resolve(new Set(['./services'])),
    inspectRuntimeRegistries: generate,
  };
  return {
    command: createDoctorPluginCommand({
      resolveProjectRoot: () => Promise.resolve(projectRoot),
      doctor: (input) => doctorPlugin(input, dependencies),
      diagnosticEvidence: () => NOOP_EVIDENCE,
      print: (line) => output.push(line),
    }),
    output,
  };
}

async function writeProject(projectRoot: string): Promise<void> {
  await writeProjectConfig(projectRoot);
  await write(
    join(projectRoot, 'appsettings.json'),
    `${
      JSON.stringify({
        NetScript: {
          Plugins: {
            sagas: {
              Entrypoint: netscriptJsrSpecifier('plugin-sagas', '/services'),
            },
          },
        },
      })
    }\n`,
  );
}

async function writeProjectConfig(projectRoot: string): Promise<void> {
  const rootConfig = JSON.parse(await Deno.readTextFile(join(REPOSITORY_ROOT, 'deno.json'))) as {
    readonly imports: Readonly<Record<string, string>>;
  };
  await write(
    join(projectRoot, 'deno.json'),
    `${
      JSON.stringify({
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
      })
    }\n`,
  );
}

async function writeAiProject(projectRoot: string): Promise<void> {
  const rootConfig = JSON.parse(await Deno.readTextFile(join(REPOSITORY_ROOT, 'deno.json'))) as {
    readonly imports: Readonly<Record<string, string>>;
  };
  await write(
    join(projectRoot, 'deno.json'),
    `${
      JSON.stringify({
        catalog: SCAFFOLD_WORKSPACE_CATALOG,
        imports: {
          ...rootConfig.imports,
          '@netscript/plugin/cli': toFileUrl(
            join(REPOSITORY_ROOT, 'packages/plugin/src/cli/mod.ts'),
          ).href,
        },
        workspace: ['./plugins/*'],
      })
    }\n`,
  );
  await copy(join(REPOSITORY_ROOT, 'plugins/ai'), join(projectRoot, 'plugins/ai'));
  await write(
    join(projectRoot, 'appsettings.json'),
    `${
      JSON.stringify({
        NetScript: {
          Plugins: {
            ai: { Entrypoint: netscriptJsrSpecifier('plugin-ai', '/services') },
          },
        },
      })
    }\n`,
  );
  await write(
    join(projectRoot, 'ai/tools/e2e-tool.ts'),
    `
export default {
  descriptor: { name: 'e2e-tool' },
  schema: {},
  execute: async () => ({ state: 'output-available', output: { ok: true } }),
};
`,
  );
  await write(
    join(projectRoot, 'ai/tools/skill-loader.ts'),
    `
export function createSkillLoaderTool(skills: unknown) {
  return { skills };
}
`,
  );
  await write(
    join(projectRoot, 'ai/agents/assistant.ts'),
    'export default function assistant() { return {}; }\n',
  );
}

async function snapshotProjectFiles(
  projectRoot: string,
): Promise<Readonly<Record<string, readonly number[]>>> {
  const paths: string[] = [];
  for await (const entry of walk(projectRoot, { includeDirs: false, followSymlinks: false })) {
    if (entry.isFile) paths.push(entry.path);
  }
  paths.sort((left, right) => left.localeCompare(right));
  const snapshot: Record<string, readonly number[]> = {};
  for (const path of paths) {
    snapshot[relative(projectRoot, path).replaceAll('\\', '/')] = [...await Deno.readFile(path)];
  }
  return snapshot;
}

async function writeSaga(projectRoot: string, id: string): Promise<void> {
  await write(
    join(projectRoot, 'sagas', `${id}.ts`),
    `
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
`,
  );
}

async function write(path: string, text: string): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, text);
}
