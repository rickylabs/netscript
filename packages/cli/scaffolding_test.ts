import { assertEquals } from 'jsr:@std/assert@^1';

import {
  createPluginScaffoldContext,
  MemoryFileSystemAdapter,
  planPluginScaffoldFiles,
  StringTemplateAdapter,
  writePluginScaffoldFiles,
} from './scaffolding.ts';

Deno.test('plugin scaffolding plans and writes plugin-owned templates', async () => {
  const fs = new MemoryFileSystemAdapter();
  const template = new StringTemplateAdapter(fs);
  const context = createPluginScaffoldContext({
    targetPath: '/workspace/plugins/audit-log',
    pluginName: 'audit-log',
  });
  const definition = {
    directories: [{ path: 'src' }],
    templates: [{
      path: 'src/mod.ts',
      content: 'export class {{pluginName | pascalCase}}Plugin {}\n',
    }],
  };

  const planned = await planPluginScaffoldFiles(definition, context, { template });
  assertEquals(planned, [{
    path: '/workspace/plugins/audit-log/src/mod.ts',
    content: 'export class AuditLogPlugin {}\n',
  }]);

  const result = await writePluginScaffoldFiles(definition, context, { fs, template });
  assertEquals(result.filesCreated, ['/workspace/plugins/audit-log/src/mod.ts']);
  assertEquals(result.directoriesCreated, ['/workspace/plugins/audit-log/src']);
  assertEquals(
    await fs.readFile('/workspace/plugins/audit-log/src/mod.ts'),
    'export class AuditLogPlugin {}\n',
  );
});

Deno.test('plugin scaffolding skips existing files unless overwrite is enabled', async () => {
  const fs = new MemoryFileSystemAdapter();
  const template = new StringTemplateAdapter(fs);
  await fs.writeFile('/workspace/plugins/audit-log/mod.ts', 'old\n');
  const definition = {
    templates: [{ path: 'mod.ts', content: 'new {{pluginName}}\n' }],
  };

  const skipped = await writePluginScaffoldFiles(
    definition,
    createPluginScaffoldContext({
      targetPath: '/workspace/plugins/audit-log',
      pluginName: 'audit-log',
    }),
    { fs, template },
  );
  assertEquals(skipped.filesSkipped, ['/workspace/plugins/audit-log/mod.ts']);
  assertEquals(await fs.readFile('/workspace/plugins/audit-log/mod.ts'), 'old\n');

  const overwritten = await writePluginScaffoldFiles(
    definition,
    createPluginScaffoldContext({
      targetPath: '/workspace/plugins/audit-log',
      pluginName: 'audit-log',
      overwrite: true,
    }),
    { fs, template },
  );
  assertEquals(overwritten.filesCreated, ['/workspace/plugins/audit-log/mod.ts']);
  assertEquals(await fs.readFile('/workspace/plugins/audit-log/mod.ts'), 'new audit-log\n');
});
