import { assertEquals } from '@std/assert';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import type { ScaffolderPort, TemplatePort } from '../../../../kernel/ports/template-port.ts';
import { generateAspire } from './generate-aspire.ts';
import type { GeneratedSourceFormatterPort } from '../../../../kernel/ports/generated-source-formatter-port.ts';

Deno.test('generateAspire applies dry-run and force to helper regeneration', async () => {
  const calls: unknown[] = [];
  const formatter: GeneratedSourceFormatterPort = {
    formatContent: (_path, content) => Promise.resolve(content),
    formatFiles: () => Promise.resolve({ code: 0, stdout: '', stderr: '' }),
  };
  const result = await generateAspire({
    projectRoot: '/workspace/shop',
    dryRun: true,
    force: true,
  }, {
    fs: new MemoryFileSystemAdapter(),
    scaffolder: {} as ScaffolderPort,
    templateAdapter: {} as TemplatePort,
    formatter,
    regenerateHelpers: (_root, _fs, _scaffolder, _template, options) => {
      calls.push(options);
      return Promise.resolve(['/workspace/shop/aspire/apphost.ts']);
    },
  });

  assertEquals(calls, [{ dryRun: true, force: true, formatter }]);
  assertEquals(result.helperFiles, ['/workspace/shop/aspire/apphost.ts']);
});
