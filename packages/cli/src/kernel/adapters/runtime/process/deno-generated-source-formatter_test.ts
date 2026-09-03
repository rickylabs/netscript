import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import type { ProcessPort, ProcessResult } from '../../../ports/process-port.ts';
import { DenoGeneratedSourceFormatter } from './deno-generated-source-formatter.ts';
import { DenoProcess } from './deno-process.ts';

class RecordingProcess implements ProcessPort {
  readonly calls: Array<{
    command: string;
    args: readonly string[];
    cwd?: string;
    stdin?: string;
  }> = [];

  constructor(private readonly result: ProcessResult) {}

  exec(
    command: string,
    args: readonly string[],
    options?: {
      readonly cwd?: string;
      readonly stdin?: string;
    },
  ): Promise<ProcessResult> {
    this.calls.push({ command, args, cwd: options?.cwd, stdin: options?.stdin });
    return Promise.resolve(this.result);
  }
}

Deno.test('generated source formatter canonicalizes stdin with target-derived dialect', async () => {
  const formatter = new DenoGeneratedSourceFormatter(new DenoProcess());
  const once = await formatter.formatContent(
    '/workspace/aspire/.helpers/index.mts',
    'export const value={name:"demo"}\n',
  );
  const twice = await formatter.formatContent('/workspace/aspire/.helpers/index.mts', once);

  assertEquals(once, "export const value = { name: 'demo' };\n");
  assertEquals(twice, once);
});

Deno.test('generated source formatter uses the generated style command', async () => {
  const process = new RecordingProcess({ code: 0, stdout: 'formatted\n', stderr: '' });
  const formatter = new DenoGeneratedSourceFormatter(process);

  assertEquals(await formatter.formatContent('/workspace/service.ts', 'raw'), 'formatted\n');
  assertEquals(process.calls, [{
    command: 'deno',
    args: [
      'fmt',
      '--no-config',
      '--line-width',
      '100',
      '--single-quote',
      '--ext',
      'ts',
      '-',
    ],
    cwd: undefined,
    stdin: 'raw',
  }]);
});

Deno.test('generated source formatter passes through supported empty content without spawning', async () => {
  const process = new RecordingProcess({ code: 0, stdout: 'unexpected', stderr: '' });
  const formatter = new DenoGeneratedSourceFormatter(process);

  assertEquals(await formatter.formatContent('/workspace/empty.ts', ''), '');
  assertEquals(process.calls, []);
});

Deno.test('generated source formatter rejects missing and unsupported extensions before spawning', async () => {
  const process = new RecordingProcess({ code: 0, stdout: 'unexpected', stderr: '' });
  const formatter = new DenoGeneratedSourceFormatter(process);

  await assertRejects(
    () => formatter.formatContent('/workspace/no-extension', 'const value=1'),
    Error,
    '/workspace/no-extension',
  );
  await assertRejects(
    () => formatter.formatContent('/workspace/empty.unsupported', ''),
    Error,
    '/workspace/empty.unsupported',
  );
  assertEquals(process.calls, []);
});

Deno.test('generated source formatter failure names the target and preserves stderr', async () => {
  const process = new RecordingProcess({ code: 1, stdout: '', stderr: 'parse failed' });
  const formatter = new DenoGeneratedSourceFormatter(process);

  const error = await assertRejects(
    () => formatter.formatContent('/workspace/broken.ts', 'not valid'),
    Error,
  );
  assertStringIncludes(error.message, '/workspace/broken.ts');
  assertStringIncludes(error.message, 'parse failed');
});
