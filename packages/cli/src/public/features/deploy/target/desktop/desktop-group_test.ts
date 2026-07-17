import { assertEquals } from 'jsr:@std/assert@^1';
import type { ProcessPort, ProcessResult } from '../../../../../kernel/ports/process-port.ts';
import { createDesktopDeployCommand } from './desktop-group.ts';

const process: ProcessPort = {
  exec(): Promise<ProcessResult> {
    return Promise.resolve({ code: 0, stdout: '', stderr: '' });
  },
};

const fileSystem = { createDir: () => Promise.resolve() };

Deno.test('desktop deploy group exposes the native package command', () => {
  const command = createDesktopDeployCommand({
    process,
    fileSystem,
    resolveProjectRoot: () => Promise.resolve('/project'),
  });

  assertEquals(command.getCommands().map((entry) => entry.getName()), ['package', 'release']);
  assertEquals(
    command.getCommands().find((entry) => entry.getName() === 'release')?.getCommands().map((entry) =>
      entry.getName()
    ),
    ['prepare', 'serve'],
  );
});
