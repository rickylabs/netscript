import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { dirname, fromFileUrl, join, toFileUrl } from '@std/path';
import { type WorkersConfigData, WorkersConfigSchema } from '@netscript/plugin-workers-core/config';
import { writeOfficialSampleConfiguration } from '../../src/cli/official-sample-configuration.ts';
import { generateRuntimeRegistries } from '../../src/cli/runtime-registry-generator.ts';

const REPOSITORY_ROOT = fromFileUrl(new URL('../../../..', import.meta.url));
const GENERATOR_ENTRY = join(
  REPOSITORY_ROOT,
  'plugins/workers/src/cli/generate-runtime-registries.ts',
);
const REGISTRY_PATH = '.netscript/generated/plugin-workers/job-registry.ts';

type GeneratedRegistryModule = Readonly<{
  jobDefinitions: Map<string, Readonly<Record<string, unknown>>>;
  registry: Map<string, unknown>;
}>;

Deno.test('entry generator loads real config, preserves normalized policy, and groups wholly shadow flat jobs', async () => {
  await withTempProject(async (projectRoot) => {
    await writeProjectDenoConfig(projectRoot);
    await writeWorkersManifest(projectRoot);
    await writeJob(projectRoot, 'configured-job.ts');
    await writeJob(projectRoot, 'unconfigured-job.ts');
    await write(
      join(projectRoot, 'netscript.config.ts'),
      `export default {
  name: 'policy-project',
  databases: { config: [] },
  workers: {
    jobsDir: '.\\\\workers\\\\jobs',
    groups: [{
      topic: 'group-topic',
      jobs: [{
        id: 'configured-id',
        topic: 'ignored-group-input',
        name: 'Configured job',
        description: 'Every supported field survives',
        entrypoint: '.\\\\nested\\\\..\\\\configured-job.ts',
        source: 'local',
        schedule: '*/5 * * * *',
        timezone: 'America/Chicago',
        timeout: 4321,
        maxRetries: 7,
        priority: 91,
        retryDelay: 222,
        maxConcurrency: 0,
        persist: false,
        permissions: { net: ['api.example.com'], read: true, env: ['TOKEN'], ffi: false },
        tags: ['configured', 'grouped'],
        metadata: { owner: 'payments', nested: { enabled: true } },
        retention: { archiveToDb: false, kvRetentionDays: 2, dbRetentionDays: 8, maxExecutions: 12 },
        enabled: false,
      }],
    }],
    jobs: [{
      id: 'configured-id',
      name: 'Flat policy must not merge',
      entrypoint: './configured-job.ts',
      source: 'local',
      topic: 'flat-topic',
      timeout: 999999,
      priority: 1,
      persist: true,
    }],
  },
};
`,
    );

    const result = await runEntryGenerator(projectRoot);
    assertEquals(result.code, 0, result.stderr);
    assertStringIncludes(result.stderr, 'wholly shadows flat workers.jobs[0]');

    const module = await importRegistry(projectRoot, 'entry-policy');
    assertEquals(module.registry.has('configured-id'), true);
    assertEquals(module.registry.has('configured-job'), false);
    assertEquals(module.jobDefinitions.get('configured-id'), {
      id: 'configured-id',
      topic: 'group-topic',
      name: 'Configured job',
      description: 'Every supported field survives',
      entrypoint: './configured-job.ts',
      source: 'local',
      schedule: '*/5 * * * *',
      timezone: 'America/Chicago',
      timeout: 4321,
      maxRetries: 7,
      priority: 91,
      retryDelay: 222,
      maxConcurrency: 0,
      persist: false,
      permissions: { net: ['api.example.com'], read: true, env: ['TOKEN'], ffi: false },
      tags: ['configured', 'grouped'],
      metadata: { owner: 'payments', nested: { enabled: true } },
      retention: {
        archiveToDb: false,
        kvRetentionDays: 2,
        dbRetentionDays: 8,
        maxExecutions: 12,
      },
      enabled: false,
      executionType: 'deno',
    });
    assertEquals(
      module.jobDefinitions.get('unconfigured-job'),
      genericDefinition(
        'unconfigured-job',
        './unconfigured-job.ts',
      ),
    );
  });
});

Deno.test('Windows and POSIX configured entrypoints generate identical policy', async () => {
  await withTempProject(async (projectRoot) => {
    await writeWorkersManifest(projectRoot);
    await writeJob(projectRoot, 'create-user-settings.ts');
    const definitions = new Map<string, Readonly<Record<string, unknown>> | undefined>();

    for (
      const [label, entrypoint] of [
        ['posix', 'jobs/create-user-settings.ts'],
        ['windows', 'jobs\\create-user-settings.ts'],
      ] as const
    ) {
      const workers = WorkersConfigSchema.parse({
        jobsDir: './workers',
        jobs: [{
          id: 'configured-user-settings',
          name: 'Configured user settings',
          entrypoint,
          priority: 77,
          maxConcurrency: 0,
          persist: false,
          tags: ['configured'],
        }],
      });
      await generateRuntimeRegistries(generatorOptions(projectRoot, workers));
      const module = await importRegistry(projectRoot, `separator-${label}`);
      definitions.set(label, module.jobDefinitions.get('configured-user-settings'));
    }

    const posix = definitions.get('posix');
    assertEquals(posix?.id, 'configured-user-settings');
    assertEquals(posix?.priority, 77);
    assertEquals(definitions.get('windows'), posix);
  });
});

Deno.test('official sample config survives config-aware registry regeneration', async () => {
  await withTempProject(async (projectRoot) => {
    await writeWorkersManifest(projectRoot, true);
    await writeJob(projectRoot, 'send-welcome-email.ts');
    await Deno.mkdir(join(projectRoot, 'sagas'), { recursive: true });
    await writeOfficialSampleConfiguration({ projectRoot, force: false });

    const sampleConfig = await import(
      `${toFileUrl(join(projectRoot, 'config/official-plugins/mod.ts')).href}?official-sample`
    ) as Readonly<{ workers: unknown }>;
    const workers = WorkersConfigSchema.parse(sampleConfig.workers);

    assertEquals(
      await generateRuntimeRegistries(generatorOptions(projectRoot, workers)),
      [REGISTRY_PATH],
    );
  });
});

Deno.test('entry generator preserves generic behavior when config has no workers section', async () => {
  await withTempProject(async (projectRoot) => {
    await writeProjectDenoConfig(projectRoot);
    await writeWorkersManifest(projectRoot);
    await writeJob(projectRoot, 'generic-job.ts');
    await write(
      join(projectRoot, 'netscript.config.ts'),
      `export default { name: 'generic-project', databases: { config: [] } };\n`,
    );

    const result = await runEntryGenerator(projectRoot);
    assertEquals(result.code, 0, result.stderr);
    const module = await importRegistry(projectRoot, 'absent-workers');
    assertEquals(
      module.jobDefinitions.get('generic-job'),
      genericDefinition('generic-job', './generic-job.ts'),
    );
  });
});

Deno.test('entry generator stops before writing output for malformed workers config', async () => {
  await withTempProject(async (projectRoot) => {
    await writeProjectDenoConfig(projectRoot);
    await writeWorkersManifest(projectRoot);
    await writeJob(projectRoot, 'invalid-job.ts');
    await write(
      join(projectRoot, 'netscript.config.ts'),
      `export default {
  name: 'invalid-project',
  databases: { config: [] },
  workers: { jobs: [{ id: 'invalid', name: 'Invalid', entrypoint: './invalid-job.ts', priority: 101 }] },
};
`,
    );

    const result = await runEntryGenerator(projectRoot);
    assertEquals(result.code !== 0, true);
    assertStringIncludes(result.stderr, 'Invalid workers configuration');
    assertEquals(await pathExists(join(projectRoot, REGISTRY_PATH)), false);
  });
});

Deno.test('normalized matcher rejects conflicting paths, ids, sources, and unmatched entries', async () => {
  const cases: readonly Readonly<{
    files: readonly string[];
    message: string;
    workers: unknown;
  }>[] = [
    {
      files: ['one.ts'],
      message: 'paired with conflicting ids',
      workers: {
        jobs: [
          jobPolicy('one', './one.ts'),
          jobPolicy('two', './one.ts'),
        ],
      },
    },
    {
      files: ['one.ts'],
      message: 'duplicate policies',
      workers: {
        jobs: [
          jobPolicy('one', './one.ts'),
          jobPolicy('one', './one.ts'),
        ],
      },
    },
    {
      files: ['one.ts', 'two.ts'],
      message: 'paired with conflicting paths',
      workers: {
        jobs: [
          jobPolicy('same', './one.ts'),
          jobPolicy('same', './two.ts'),
        ],
      },
    },
    {
      files: ['one.ts'],
      message: 'discovery identified that file as source "local"',
      workers: { jobs: [{ ...jobPolicy('one', './one.ts'), source: 'plugin' }] },
    },
    {
      files: [],
      message: 'unmatched project path',
      workers: { jobs: [jobPolicy('missing', './missing.ts')] },
    },
  ];

  for (const [index, testCase] of cases.entries()) {
    await withTempProject(async (projectRoot) => {
      await writeWorkersManifest(projectRoot);
      for (const file of testCase.files) await writeJob(projectRoot, file);
      const workers = WorkersConfigSchema.parse(testCase.workers);
      await assertRejects(
        () => generateRuntimeRegistries(generatorOptions(projectRoot, workers)),
        Error,
        testCase.message,
        `case ${index}`,
      );
    });
  }
});

Deno.test('configured plugin policy rejects an intrinsic handler id mismatch', async () => {
  await withTempProject(async (projectRoot) => {
    await writeWorkersManifest(projectRoot, true);
    await write(
      join(projectRoot, 'plugins/workers/jobs/intrinsic.ts'),
      `export default Object.assign(async () => undefined, { id: 'actual-plugin-id' as const });\n`,
    );
    const workers = WorkersConfigSchema.parse({
      jobsDir: './workers/jobs',
      jobs: [{
        id: 'configured-plugin-id',
        name: 'Configured plugin job',
        entrypoint: '../../plugins/workers/jobs/intrinsic.ts',
        source: 'plugin',
      }],
    });

    await generateRuntimeRegistries(generatorOptions(projectRoot, workers));
    await assertRejects(
      () => importRegistry(projectRoot, 'plugin-id-mismatch'),
      Error,
      'does not match discovered plugin handler id',
    );
  });
});

Deno.test('generated registry preserves literal job payload types at the consumer boundary', async () => {
  await withTempProject(async (projectRoot) => {
    await writeProjectDenoConfig(projectRoot);
    await writeWorkersManifest(projectRoot, false, true);
    await write(
      join(projectRoot, 'registry-types.ts'),
      `export type JobContext<TPayload> = Readonly<{
  id: string;
  job: Readonly<{ id: string }>;
  payload: TPayload;
}>;
export type JobHandler<TPayload = unknown> = (
  context: JobContext<TPayload>,
) => unknown | Promise<unknown>;
export type RegisterJobInput = Readonly<Record<string, unknown> & { id?: string }>;
`,
    );
    await writeTypedJob(
      projectRoot,
      'embed-document.ts',
      'Readonly<{ documentId: string; text: string }>',
    );
    await writeTypedJob(
      projectRoot,
      'transcribe-image.ts',
      'Readonly<{ imageUrl: string; language?: string }>',
    );

    await generateRuntimeRegistries(generatorOptions(projectRoot));
    const registrySource = await Deno.readTextFile(join(projectRoot, REGISTRY_PATH));
    const hasLiteralRegistry = registrySource.includes('export const jobHandlersById');
    const importedRegistry = hasLiteralRegistry ? 'jobHandlersById' : 'registry';
    const transcribeHandler = hasLiteralRegistry
      ? 'jobHandlersById["transcribe-image"]'
      : 'registry.get("transcribe-image")!';
    await write(
      join(projectRoot, 'payload-consumer.ts'),
      `import { ${importedRegistry} } from './${REGISTRY_PATH}';

const transcribeImage = ${transcribeHandler};
const job = { id: 'transcribe-image' };

await transcribeImage({
  id: 'execution-valid',
  job,
  payload: { imageUrl: 'https://example.test/image.png' },
});

await transcribeImage({
  id: 'execution-invalid',
  job,
  // @ts-expect-error - embed-document payload must not compile for transcribe-image
  payload: { documentId: 'doc-1', text: 'content' },
});
`,
    );

    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'check',
        '--no-lock',
        '--config',
        join(projectRoot, 'deno.json'),
        join(projectRoot, 'payload-consumer.ts'),
      ],
      cwd: projectRoot,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const stderr = new TextDecoder().decode(output.stderr);
    assertEquals(output.code, 0, stderr);
  });
});

function jobPolicy(id: string, entrypoint: string): Readonly<Record<string, unknown>> {
  return { id, name: id, entrypoint, source: 'local' };
}

function generatorOptions(
  projectRoot: string,
  workers?: WorkersConfigData,
): Readonly<{
  manifestPath: string;
  projectRoot: string;
  workers?: WorkersConfigData;
}> {
  return {
    manifestPath: join(projectRoot, 'scaffold.runtime.json'),
    projectRoot,
    ...(workers ? { workers } : {}),
  };
}

function genericDefinition(id: string, entrypoint: string): Readonly<Record<string, unknown>> {
  return {
    id,
    name: id.split('-').map((part) => `${part[0]?.toUpperCase()}${part.slice(1)}`).join(' '),
    entrypoint,
    topic: 'default',
    source: 'local',
    executionType: 'deno',
    timezone: 'UTC',
    timeout: 300000,
    maxRetries: 3,
    retryDelay: 1000,
    maxConcurrency: 1,
    priority: 50,
    enabled: true,
    persist: true,
    tags: [],
  };
}

async function runEntryGenerator(
  projectRoot: string,
): Promise<Readonly<{ code: number; stderr: string; stdout: string }>> {
  const output = await new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--no-lock',
      '--config',
      join(projectRoot, 'deno.json'),
      '--allow-read',
      '--allow-write',
      GENERATOR_ENTRY,
      '--project-root',
      projectRoot,
      '--manifest',
      join(projectRoot, 'scaffold.runtime.json'),
      '--official-samples',
      'false',
    ],
    cwd: projectRoot,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const decoder = new TextDecoder();
  return {
    code: output.code,
    stdout: decoder.decode(output.stdout),
    stderr: decoder.decode(output.stderr),
  };
}

async function importRegistry(
  projectRoot: string,
  query: string,
): Promise<GeneratedRegistryModule> {
  return await import(
    `${toFileUrl(join(projectRoot, REGISTRY_PATH)).href}?${query}`
  ) as GeneratedRegistryModule;
}

async function writeProjectDenoConfig(projectRoot: string): Promise<void> {
  const rootConfig = JSON.parse(await Deno.readTextFile(join(REPOSITORY_ROOT, 'deno.json'))) as {
    catalog?: Readonly<Record<string, string>>;
    imports?: Readonly<Record<string, string>>;
  };
  const configPackage = JSON.parse(
    await Deno.readTextFile(join(REPOSITORY_ROOT, 'packages/config/deno.json')),
  ) as { imports?: Readonly<Record<string, string>> };
  const workersCore = JSON.parse(
    await Deno.readTextFile(join(REPOSITORY_ROOT, 'packages/plugin-workers-core/deno.json')),
  ) as { imports?: Readonly<Record<string, string>> };
  const telemetry = JSON.parse(
    await Deno.readTextFile(join(REPOSITORY_ROOT, 'packages/telemetry/deno.json')),
  ) as { imports?: Readonly<Record<string, string>> };
  await write(
    join(projectRoot, 'deno.json'),
    `${
      JSON.stringify({
        catalog: rootConfig.catalog,
        imports: {
          ...rootConfig.imports,
          ...configPackage.imports,
          ...workersCore.imports,
          ...telemetry.imports,
          '@netscript/config': toFileUrl(join(REPOSITORY_ROOT, 'packages/config/mod.ts')).href,
          '@netscript/plugin-workers-core/config': toFileUrl(
            join(REPOSITORY_ROOT, 'packages/plugin-workers-core/src/config/mod.ts'),
          ).href,
          '@netscript/plugin-workers-core/runtime': toFileUrl(
            join(REPOSITORY_ROOT, 'packages/plugin-workers-core/src/runtime/mod.ts'),
          ).href,
        },
      })
    }\n`,
  );
}

async function writeWorkersManifest(
  projectRoot: string,
  includePluginDir = false,
  widenHandlersToAny = false,
): Promise<void> {
  await write(
    join(projectRoot, 'scaffold.runtime.json'),
    `${
      JSON.stringify({
        runtimeRegistries: [{
          kind: 'workers-job',
          dir: 'workers/jobs',
          registryPath: REGISTRY_PATH,
          fileSuffixes: ['.ts'],
          exclude: [],
          registryKey: 'id',
          varPrefix: 'job',
          typeImport: {
            name: 'JobHandler',
            from: widenHandlersToAny
              ? '../../../registry-types.ts'
              : '@netscript/plugin-workers-core/runtime',
          },
          ...(widenHandlersToAny
            ? {
              mapValueType: 'JobHandler<any>',
              preamble: ['// deno-lint-ignore-file no-explicit-any'],
            }
            : {}),
          ...(includePluginDir
            ? {
              pluginDirs: [{
                dir: 'plugins/workers/jobs',
                importPrefix: '../../../plugins/workers/jobs',
                label: 'workers',
                pluginId: 'workers',
                varPrefix: 'workersPlugin',
                exclude: [],
              }],
            }
            : {}),
        }],
      })
    }\n`,
  );
}

async function writeTypedJob(
  projectRoot: string,
  file: string,
  payloadType: string,
): Promise<void> {
  await write(
    join(projectRoot, 'workers/jobs', file),
    `import type { JobHandler } from '../../registry-types.ts';

const handler: JobHandler<${payloadType}> = async () => ({ success: true });
export default handler;
`,
  );
}

async function writeJob(projectRoot: string, file: string): Promise<void> {
  await write(
    join(projectRoot, 'workers/jobs', file),
    'export default async function job(): Promise<void> {}\n',
  );
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

async function withTempProject(run: (projectRoot: string) => Promise<void>): Promise<void> {
  const projectRoot = await Deno.makeTempDir({ prefix: 'netscript-workers-registry-' });
  try {
    await run(projectRoot);
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
}

async function write(path: string, text: string): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, text);
}
