import { assertEquals } from '@std/assert';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import type { ScaffolderPort, TemplatePort } from '../../../../kernel/ports/template-port.ts';
import { generateAspire } from './generate-aspire.ts';

Deno.test('generateAspire applies dry-run and force to helper regeneration', async () => {
  const calls: unknown[] = [];
  const result = await generateAspire({
    projectRoot: '/workspace/shop',
    dryRun: true,
    force: true,
  }, {
    fs: new MemoryFileSystemAdapter(),
    scaffolder: {} as ScaffolderPort,
    templateAdapter: {} as TemplatePort,
    regenerateHelpers: (_root, _fs, _scaffolder, _template, options) => {
      calls.push(options);
      return Promise.resolve(['/workspace/shop/aspire/apphost.ts']);
    },
  });

  assertEquals(calls, [{ dryRun: true, force: true }]);
  assertEquals(result.helperFiles, ['/workspace/shop/aspire/apphost.ts']);
});
