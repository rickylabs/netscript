import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';

import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import type { ScaffolderPort, TemplatePort } from '../../../../kernel/ports/template-port.ts';
import { generateAspire } from '../aspire/generate-aspire.ts';
import { generateConfigSchema, planConfigSchemaWrites } from './generate-runtime-schemas.ts';

describe('public generate application flows', () => {
  it('regenerates Aspire helpers through an injected helper generator', async () => {
    const fs = new MemoryFileSystemAdapter();
    const projectRoot = 'C:/workspace/alpha';
    const result = await generateAspire({
      projectRoot,
    }, {
      fs,
      scaffolder: {} as ScaffolderPort,
      templateAdapter: {} as TemplatePort,
      regenerateHelpers: (projectRoot) =>
        Promise.resolve([
          `${projectRoot}/.aspire/apphost.ts`,
          `${projectRoot}/.aspire/config-schema.ts`,
        ]),
    });

    assertEquals(result.helperFiles, [
      'C:/workspace/alpha/.aspire/apphost.ts',
      'C:/workspace/alpha/.aspire/config-schema.ts',
    ]);
  });

  it('plans runtime config schema writes with configured paths', () => {
    const projectRoot = 'C:/workspace/alpha';
    const writes = planConfigSchemaWrites({
      projectRoot,
      runtimeConfigPaths: {
        jobs: { schemaPath: 'config/runtime/jobs.schema.json' },
      },
      plugins: [{
        pluginName: '@alpha/jobs',
        schemas: [{
          topic: 'jobs',
          schema: { type: 'object', properties: { enabled: { type: 'boolean' } } },
        }],
      }],
    });

    assertEquals(writes.map((write) => write.outputPath.replaceAll('\\', '/')), [
      'C:/workspace/alpha/config/runtime/jobs.schema.json',
    ]);
    assertEquals(JSON.parse(writes[0].content), {
      type: 'object',
      properties: { enabled: { type: 'boolean' } },
    });
  });

  it('writes changed schemas and skips unchanged files', async () => {
    const fs = new MemoryFileSystemAdapter();
    const projectRoot = 'C:/workspace/alpha';
    await fs.writeFile(
      'C:/workspace/alpha/triggers/runtime/schema.json',
      JSON.stringify({ type: 'object' }, null, 2) + '\n',
    );

    const result = await generateConfigSchema({
      projectRoot,
      runtimeConfigPaths: {},
      dryRun: false,
      force: false,
      plugins: [{
        pluginName: '@alpha/triggers',
        schemas: [{
          topic: 'triggers',
          schema: { type: 'object' },
        }],
      }, {
        pluginName: '@alpha/jobs',
        schemas: [{
          topic: 'jobs',
          schema: { type: 'object', required: ['name'] },
        }],
      }],
    }, { fs });

    assertEquals(result.skipped.map((write) => write.topic), ['triggers']);
    assertEquals(result.written.map((write) => write.topic), ['jobs']);
    assertEquals(
      await fs.readFile('C:/workspace/alpha/jobs/runtime/schema.json'),
      JSON.stringify({ type: 'object', required: ['name'] }, null, 2) + '\n',
    );
  });

  it('rejects duplicate runtime config schema topics', async () => {
    const fs = new MemoryFileSystemAdapter();

    await assertRejects(
      () =>
        generateConfigSchema({
          projectRoot: 'C:/workspace/alpha',
          runtimeConfigPaths: {},
          dryRun: false,
          force: false,
          plugins: [
            { pluginName: 'one', schemas: [{ topic: 'jobs', schema: {} }] },
            { pluginName: 'two', schemas: [{ topic: 'jobs', schema: {} }] },
          ],
        }, { fs }),
      Error,
      'multiple plugins',
    );
  });
});
