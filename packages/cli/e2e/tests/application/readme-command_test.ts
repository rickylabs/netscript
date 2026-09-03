import { assertEquals, assertRejects } from '@std/assert';
import { DELIMITER, resolve } from '@std/path';
import type {
  AspireCommandResult,
  AspireCommandRunner,
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
  '--minimum-dependency-age=0',
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
    const staleBinary = resolve(pathPrepend, 'netscript');
    await Deno.mkdir(pathPrepend, { recursive: true });
    await Deno.writeTextFile(staleBinary, 'stale ambient collision');
    const spawns: Array<{
      argv: readonly string[];
      env?: Record<string, string>;
    }> = [];
    const spawn: AspireCommandRunner = (command, _cwd, _timeoutMs, env) => {
      spawns.push({ argv: command, env });
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
    await assertRejects(() => Deno.stat(staleBinary), Deno.errors.NotFound);
    const persistedState = JSON.parse(await Deno.readTextFile(statePath));
    assertEquals(persistedState.denoInstallRoot, denoInstallRoot);
    assertEquals(
      await executeReadmeQuickstartCommand(
        repoRoot,
        resolve(temporaryRoot, 'different-run-root'),
        '/unused/apphost.mts',
        1,
        EXACT_CLI,
        statePath,
        1_000,
        spawn,
      ),
      0,
    );

    assertEquals(spawns[0].argv, EXPECTED_INSTALL_ARGV);
    assertEquals(spawns[0].argv.includes('-f'), false);
    assertEquals(
      spawns[0].argv.filter((token) => token === '--minimum-dependency-age=0').length,
      1,
    );
    assertEquals(spawns[0].env?.DENO_INSTALL_ROOT, denoInstallRoot);
    assertEquals(spawns[0].env?.PATH?.startsWith(`${pathPrepend}${DELIMITER}`), true);
    assertEquals(spawns[1].env, spawns[0].env);
    const receipt = JSON.parse(
      await Deno.readTextFile(resolve(temporaryRoot, 'receipts', '01.json')),
    );
    assertEquals(
      receipt.sourceCommand.split('--minimum-dependency-age=0').length - 1,
      1,
    );
    assertEquals(receipt.environment, { denoInstallRoot, pathPrepend });
  } finally {
    await Deno.remove(temporaryRoot, { recursive: true });
  }
});
