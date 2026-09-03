import { assertEquals } from '@std/assert';
import { DELIMITER, resolve } from '@std/path';
import {
  type AspireCommandResult,
  type AspireCommandRunner,
} from '../../src/application/gates/quickstart/aspire-walk.ts';
import { executeReadmeQuickstartCommand } from '../../src/application/gates/quickstart/readme-command.ts';

const EXACT_CLI = 'jsr:@netscript/cli@0.0.7-canary.9';
const EXPECTED_INSTALL_ARGV = [
  'deno',
  'install',
  '--global',
  '--allow-all',
  '--name',
  'netscript',
  EXACT_CLI,
] as const;

Deno.test('README commands share a run-owned Deno install environment without changing argv', async () => {
  const temporaryRoot = await Deno.makeTempDir({ prefix: 'netscript-readme-command-' });
  try {
    const repoRoot = resolve(import.meta.dirname!, '../../../../..');
    const runRoot = resolve(temporaryRoot, 'run');
    const statePath = resolve(temporaryRoot, 'state.json');
    const denoInstallRoot = resolve(runRoot, '.deno-install');
    const pathPrepend = resolve(denoInstallRoot, 'bin');
    const spawns: Array<{
      command: readonly string[];
      env?: Record<string, string>;
    }> = [];
    const spawn: AspireCommandRunner = (command, _cwd, _timeoutMs, env) => {
      spawns.push({ command, env });
      return Promise.resolve<AspireCommandResult>({
        code: 0,
        stdout: '',
        stderr: '',
        timedOut: false,
      });
    };

    assertEquals(
      await executeReadmeQuickstartCommand(
        repoRoot,
        runRoot,
        '/unused/apphost.mts',
        0,
        EXACT_CLI,
        statePath,
        1_000,
        spawn,
      ),
      0,
    );
    assertEquals(
      await executeReadmeQuickstartCommand(
        repoRoot,
        runRoot,
        '/unused/apphost.mts',
        1,
        EXACT_CLI,
        statePath,
        1_000,
        spawn,
      ),
      0,
    );

    assertEquals(spawns[0].command, EXPECTED_INSTALL_ARGV);
    assertEquals(spawns[0].command.includes('-f'), false);
    assertEquals(spawns[0].env?.DENO_INSTALL_ROOT, denoInstallRoot);
    assertEquals(spawns[0].env?.PATH?.startsWith(`${pathPrepend}${DELIMITER}`), true);
    assertEquals(spawns[1].env, spawns[0].env);
  } finally {
    await Deno.remove(temporaryRoot, { recursive: true });
  }
});
