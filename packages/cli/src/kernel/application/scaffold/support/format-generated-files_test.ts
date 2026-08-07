import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import type { ProcessPort, ProcessResult } from '../../../ports/process-port.ts';
import { formatGeneratedFiles } from './format-generated-files.ts';

class RecordingProcess implements ProcessPort {
  readonly calls: Array<{ command: string; args: readonly string[]; cwd?: string }> = [];

  constructor(private readonly result: ProcessResult) {}

  exec(
    command: string,
    args: readonly string[],
    options?: { readonly cwd?: string },
  ): Promise<ProcessResult> {
    this.calls.push({ command, args, cwd: options?.cwd });
    return Promise.resolve(this.result);
  }
}

Deno.test('generated-file formatting uses scaffold style and the exact file list', async () => {
  const process = new RecordingProcess({ code: 0, stdout: '', stderr: '' });
  await formatGeneratedFiles(process, '/workspace/app', [
    '/workspace/app/aspire/.helpers/index.mts',
    '/workspace/app/netscript.config.ts',
  ]);

  assertEquals(process.calls, [{
    command: 'deno',
    args: [
      'fmt',
      '--no-config',
      '--line-width',
      '100',
      '--single-quote',
      '/workspace/app/aspire/.helpers/index.mts',
      '/workspace/app/netscript.config.ts',
    ],
    cwd: '/workspace/app',
  }]);
});

Deno.test('generated-file formatting propagates formatter failures', async () => {
  const process = new RecordingProcess({ code: 1, stdout: '', stderr: 'bad format' });
  await assertRejects(
    () => formatGeneratedFiles(process, '/workspace/app', ['/workspace/app/bad.ts']),
    Error,
    'Unable to format generated files: bad format',
  );
});
