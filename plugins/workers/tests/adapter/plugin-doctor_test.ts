import { assertEquals, assertStringIncludes } from '@std/assert';
import { runDoctorCommand } from '@netscript/plugin/adapter';
import { workersAdapterPlugin } from '../../src/adapter/plugin.ts';
import { PLUGIN_PACKAGE_VERSION } from '../../src/package-metadata.generated.ts';

Deno.test('workers doctor errors with a remediation when the job registry is absent', async () => {
  const report = await runDoctorCommand({
    plugin: workersAdapterPlugin,
    context: {
      workspaceRoot: '/workspace',
      options: {},
      config: { WORKERS_API_URL: 'http://localhost:9181' },
      dryRun: true,
      fileSystem: {
        exists: () => Promise.resolve(false),
        readText: () => Promise.reject(new Error('unexpected read')),
        writeText: () => Promise.reject(new Error('read only')),
      },
    },
  });
  assertEquals(report.checks.find((check) => check.name.includes('exists'))?.ok, false);
  assertStringIncludes(
    report.checks.find((check) => check.name.includes('exists'))?.message ?? '',
    `deno run -A jsr:@netscript/plugin-workers@${PLUGIN_PACKAGE_VERSION}/cli compile-registry`,
  );
});

for (
  const [name, source] of [
    [
      'compile-registry',
      `
import * as job0 from './welcome.ts';
export const jobHandlersById = Object.freeze({
  ["welcome"]: resolveJobHandler(job0, "workers/jobs/welcome.ts"),
});
const entries = [["welcome", jobHandlersById["welcome"]]];
export const registry = new Map(entries);
export const jobDefinitionsById = Object.freeze({
  ["welcome"]: createLocalJobDefinition("welcome", "./welcome.ts"),
});
const jobDefinitionEntries = Object.entries(jobDefinitionsById);
export const jobDefinitions = new Map(jobDefinitionEntries);
function createLocalJobDefinition<TId extends string>(id: TId) { return { id }; }
`,
    ],
    [
      'generate-plugins',
      `
import job0 from '../../workers/jobs/welcome.ts';
export const registry = new Map([[job0.id, job0]]);
const jobDefinitionEntries = [[job0.id, createLocalJobDefinition(job0.id, './welcome.ts')]];
export const jobDefinitions = new Map(jobDefinitionEntries);
function createLocalJobDefinition() {}
`,
    ],
  ] as const
) {
  Deno.test(`workers doctor accepts ${name} registry output`, async () => {
    const report = await runDoctorCommand({
      plugin: workersAdapterPlugin,
      context: contextWithRegistry(source, 'WORKERS_API_URL'),
    });
    assertEquals(
      report.checks.filter((check) =>
        check.name.startsWith('generated') || check.name.startsWith('every')
      ).every((check) => check.ok),
      true,
    );
  });
}

function contextWithRegistry(source: string, configKey: string) {
  return {
    workspaceRoot: '/workspace',
    options: {},
    config: { [configKey]: 'configured' },
    dryRun: true,
    fileSystem: {
      exists: () => Promise.resolve(true),
      readText: () => Promise.resolve(source),
      writeText: () => Promise.reject(new Error('read only')),
    },
  } as const;
}

for (
  const [label, source, ok] of [
    [
      'complete empty',
      'export const jobHandlersById = Object.freeze({});\nexport const jobDefinitionsById = Object.freeze({});\nexport const jobDefinitions = new Map(Object.entries(jobDefinitionsById));\nexport const registry = new Map();',
      true,
    ],
    ['truncated', '/** Registry - AUTO-GENERATED */', false],
    ['missing runtime map', 'export const jobDefinitionsById = Object.freeze({});', false],
  ] as const
) {
  Deno.test('workers doctor checks ' + label + ' registry structure', async () => {
    const report = await runDoctorCommand({
      plugin: workersAdapterPlugin,
      context: {
        workspaceRoot: '/workspace',
        options: {},
        config: { WORKERS_API_URL: 'configured' },
        dryRun: true,
        fileSystem: {
          exists: () => Promise.resolve(true),
          readText: () => Promise.resolve(source),
          writeText: () => Promise.reject(new Error('read only')),
        },
      },
    });
    assertEquals(report.checks.every((check) => check.ok), ok);
  });
}

Deno.test('workers doctor remediation uses the project CLI in a local-source workspace', async () => {
  const report = await runDoctorCommand({
    plugin: workersAdapterPlugin,
    context: {
      workspaceRoot: '/workspace',
      options: {},
      config: { WORKERS_API_URL: 'configured' },
      dryRun: true,
      fileSystem: {
        exists: (path) => Promise.resolve(path === 'packages/cli/bin/netscript-dev.ts'),
        readText: () => Promise.reject(new Error('unexpected read')),
        writeText: () => Promise.reject(new Error('read only')),
      },
    },
  });
  assertStringIncludes(
    report.checks.find((check) => check.name.includes('exists'))?.message ?? '',
    'deno run -A "packages/cli/bin/netscript-dev.ts" generate plugins --project-root "/workspace"',
  );
});
