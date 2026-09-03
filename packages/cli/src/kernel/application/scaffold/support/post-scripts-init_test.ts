import { assertEquals } from '@std/assert';
import { MemoryFileSystemAdapter } from '../../../adapters/scaffold/memory-fs.ts';
import { Scaffolder } from '../../../adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../../adapters/scaffold/template-adapter.ts';
import type { ScaffoldResult } from '../../../domain/core-types.ts';
import type { ProcessPort, ProcessResult } from '../../../ports/process-port.ts';
import type { InitPipelineContext } from '../context.ts';
import { formatOutput } from './post-scripts-init.ts';

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

function createContext(process: ProcessPort): InitPipelineContext {
  const fs = new MemoryFileSystemAdapter();
  const templateAdapter = new StringTemplateAdapter(fs);
  return {
    fs,
    process,
    templateAdapter,
    scaffolder: new Scaffolder(templateAdapter, fs),
    jsrResolver: {
      resolveImport: (specifier) => specifier,
      resolveImports: (specifiers) => Object.fromEntries(specifiers.map((value) => [value, value])),
    },
    cwd: () => '/workspace',
    resolveModeFields: () => ({}),
    packagesAsWorkspaceMembers: () => false,
    scaffoldWorkspacePackages: () => Promise.resolve(emptyResult()),
  };
}

function emptyResult(filesCreated: readonly string[] = []): ScaffoldResult {
  return {
    filesCreated: [...filesCreated],
    filesSkipped: [],
    directoriesCreated: [],
    totalOperations: filesCreated.length,
    durationMs: 0,
  };
}

Deno.test('post-init formatting delegates exact files to project policy', async () => {
  const process = new RecordingProcess({ code: 0, stdout: '', stderr: '' });
  await formatOutput(createContext(process), '/workspace/app', [
    emptyResult(['/workspace/app/src/main.ts', '/workspace/app/readme.txt']),
  ]);

  assertEquals(process.calls, [{
    command: 'deno',
    args: ['fmt', 'src/main.ts'],
    cwd: '/workspace/app',
  }]);
});

Deno.test('post-init formatting retains non-throwing warning semantics', async () => {
  const process = new RecordingProcess({ code: 1, stdout: '', stderr: 'invalid source' });
  await formatOutput(createContext(process), '/workspace/app', [
    emptyResult(['/workspace/app/src/main.ts']),
  ]);

  assertEquals(process.calls.length, 1);
});
