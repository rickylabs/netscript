import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';

import type { ProcessPort, ProcessResult } from '../../../../kernel/ports/process-port.ts';
import { RemoteError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import {
  createPluginDispatchPort,
  dispatchPluginVerb,
  isFrameworkVerb,
  resolvePluginCliSpecifier,
} from './dispatch-plugin-verb.ts';

describe('plugin verb dispatch', () => {
  it('routes framework verbs through deno dx and the plugin cli subpath', async () => {
    const processRunner = new RecordingProcess(0);

    const result = await dispatchPluginVerb('add', '@example/plugin-alpha', ['--yes'], {
      projectRoot: '/workspace/app',
      processRunner,
    });

    assertEquals(result.stdout, 'plugin output');
    assertEquals(processRunner.commands, [{
      command: 'deno',
      args: ['dx', 'jsr:@example/plugin-alpha/cli', 'add', '--yes'],
      cwd: '/workspace/app',
    }]);
  });

  it('maps non-zero plugin cli exits to remote errors', async () => {
    const processRunner = new RecordingProcess(7, 'failed');

    await assertRejects(
      () =>
        dispatchPluginVerb('doctor', '@example/plugin-alpha', [], {
          projectRoot: '/workspace/app',
          processRunner,
        }),
      RemoteError,
      'Plugin command failed',
    );
  });

  it('returns captured process output through the dispatch port', async () => {
    const processRunner = new RecordingProcess(0, 'plugin warnings', 'plugin diagnostics');
    const port = createPluginDispatchPort(processRunner);

    const result = await port.dispatch({
      verb: 'info',
      pkg: '@example/plugin-alpha',
      args: [],
      projectRoot: '/workspace/app',
      processRunner,
    });

    assertEquals(result.stdout, 'plugin diagnostics');
    assertEquals(result.stderr, 'plugin warnings');
  });

  it('identifies framework verbs and resolves jsr cli specifiers', () => {
    assertEquals(isFrameworkVerb('sync'), true);
    assertEquals(isFrameworkVerb('search'), false);
    assertEquals(
      resolvePluginCliSpecifier('@example/plugin-alpha'),
      'jsr:@example/plugin-alpha/cli',
    );
    assertEquals(
      resolvePluginCliSpecifier('jsr:@example/plugin-alpha/cli'),
      'jsr:@example/plugin-alpha/cli',
    );
  });
});

class RecordingProcess implements ProcessPort {
  readonly commands: Array<{
    readonly command: string;
    readonly args: readonly string[];
    readonly cwd?: string;
  }> = [];

  constructor(
    private readonly code: number,
    private readonly stderr = '',
    private readonly stdout = 'plugin output',
  ) {}

  exec(
    command: string,
    args: readonly string[],
    options?: { readonly cwd?: string },
  ): Promise<ProcessResult> {
    this.commands.push({ command, args, cwd: options?.cwd });
    return Promise.resolve({ code: this.code, stdout: this.stdout, stderr: this.stderr });
  }
}
