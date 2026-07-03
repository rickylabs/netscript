import { assertEquals } from 'jsr:@std/assert@^1';

import type { ProcessPort, ProcessResult } from '../../ports/process-port.ts';
import {
  buildDeleteArgs,
  buildDeployArgs,
  buildLogsArgs,
  buildStatusArgs,
  DenoDeployCliAdapter,
} from './deno-deploy-cli.ts';

interface RecordedCall {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd?: string;
}

class FakeProcess implements ProcessPort {
  readonly calls: RecordedCall[] = [];
  constructor(private readonly result: ProcessResult = { code: 0, stdout: '', stderr: '' }) {}
  exec(
    command: string,
    args: readonly string[],
    options?: { readonly cwd?: string },
  ): Promise<ProcessResult> {
    this.calls.push({ command, args: [...args], cwd: options?.cwd });
    return Promise.resolve(this.result);
  }
}

Deno.test('buildDeployArgs: preview push maps only provided flags', () => {
  assertEquals(buildDeployArgs({ projectRoot: '/p', app: 'orders' }), [
    'deploy',
    '--app',
    'orders',
  ]);
});

Deno.test('buildDeployArgs: production push maps --prod/--org/--app/--env-file/entrypoint in order', () => {
  assertEquals(
    buildDeployArgs({
      projectRoot: '/p',
      prod: true,
      org: 'acme',
      app: 'orders',
      envFile: '.env.production',
      entrypoint: 'main.ts',
    }),
    [
      'deploy',
      '--prod',
      '--org',
      'acme',
      '--app',
      'orders',
      '--env-file',
      '.env.production',
      'main.ts',
    ],
  );
});

Deno.test('buildLogsArgs/buildDeleteArgs/buildStatusArgs: map subcommand + target flags', () => {
  const inv = { projectRoot: '/p', org: 'acme', app: 'orders' };
  assertEquals(buildLogsArgs(inv), ['deploy', 'logs', '--org', 'acme', '--app', 'orders']);
  assertEquals(buildDeleteArgs(inv), ['deploy', 'delete', '--org', 'acme', '--app', 'orders']);
  assertEquals(buildStatusArgs(inv), ['deploy', 'show', '--org', 'acme', '--app', 'orders']);
});

Deno.test('DenoDeployCliAdapter: shells `deno` with deploy argv from the project root', async () => {
  const process = new FakeProcess({ code: 0, stdout: 'ok', stderr: '' });
  const adapter = new DenoDeployCliAdapter(process);

  const result = await adapter.deploy({ projectRoot: '/proj', prod: true, app: 'orders' });

  assertEquals(process.calls.length, 1);
  assertEquals(process.calls[0]?.command, 'deno');
  assertEquals(process.calls[0]?.args, ['deploy', '--prod', '--app', 'orders']);
  assertEquals(process.calls[0]?.cwd, '/proj');
  assertEquals(result, { code: 0, stdout: 'ok', stderr: '' });
});

Deno.test('DenoDeployCliAdapter: propagates a non-zero exit code', async () => {
  const process = new FakeProcess({ code: 1, stdout: '', stderr: 'auth required' });
  const adapter = new DenoDeployCliAdapter(process);

  const result = await adapter.remove({ projectRoot: '/proj', app: 'orders' });

  assertEquals(process.calls[0]?.args, ['deploy', 'delete', '--app', 'orders']);
  assertEquals(result.code, 1);
  assertEquals(result.stderr, 'auth required');
});
