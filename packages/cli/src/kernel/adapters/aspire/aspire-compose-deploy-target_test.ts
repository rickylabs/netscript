import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';

import type { ProcessPort, ProcessResult } from '../../ports/process-port.ts';
import type { DeployTargetPort } from '../../domain/deploy/deploy-target-port.ts';
import { AspireComposeDeployTarget } from './aspire-compose-deploy-target.ts';

interface RecordedCall {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd?: string;
}

class FakeProcess implements ProcessPort {
  readonly calls: RecordedCall[] = [];
  #result: ProcessResult = { code: 0, stdout: '', stderr: '' };

  setResult(result: Partial<ProcessResult>): void {
    this.#result = { code: 0, stdout: '', stderr: '', ...result };
  }

  exec(
    command: string,
    args: readonly string[],
    options?: { readonly cwd?: string },
  ): Promise<ProcessResult> {
    this.calls.push({ command, args: [...args], cwd: options?.cwd });
    return Promise.resolve(this.#result);
  }
}

const request = { projectRoot: '/proj', outputDir: '.deploy/compose' } as const;

Deno.test('compose adapter declares the supported subset and omits rollback/secrets', () => {
  const process = new FakeProcess();
  const adapter: DeployTargetPort = new AspireComposeDeployTarget({ key: 'compose', process });

  assertEquals(adapter.key, 'compose');
  assertEquals(adapter.operations, ['plan', 'emit', 'up', 'down', 'status', 'logs']);
  assertEquals(adapter.rollback, undefined);
  assertEquals(adapter.secrets, undefined);
});

Deno.test('plan/emit delegate to `aspire publish --output-path` (authors no YAML)', async () => {
  const process = new FakeProcess();
  const adapter = new AspireComposeDeployTarget({ key: 'compose', process });

  await adapter.plan(request);
  await adapter.emit(request);

  assertEquals(process.calls[0].command, 'aspire');
  assertEquals(process.calls[0].args, ['publish', '--output-path', '.deploy/compose']);
  assertEquals(process.calls[0].cwd, '/proj');
  assertEquals(process.calls[1].args, ['publish', '--output-path', '.deploy/compose']);
});

Deno.test('compose `up` self-hosts via `docker compose up -d` on the emitted file', async () => {
  const process = new FakeProcess();
  const adapter = new AspireComposeDeployTarget({ key: 'compose', process });

  await adapter.up(request);

  assertEquals(process.calls[0].command, 'docker');
  assertEquals(process.calls[0].args, [
    'compose',
    '-f',
    '.deploy/compose/docker-compose.yaml',
    'up',
    '-d',
  ]);
});

Deno.test('docker `up` delegates the apply to `aspire deploy`', async () => {
  const process = new FakeProcess();
  const adapter = new AspireComposeDeployTarget({ key: 'docker', process });

  await adapter.up(request);

  assertEquals(process.calls[0].command, 'aspire');
  assertEquals(process.calls[0].args, ['deploy']);
});

Deno.test('down/status/logs shell `docker compose` against the emitted project', async () => {
  const process = new FakeProcess();
  const adapter = new AspireComposeDeployTarget({ key: 'compose', process });

  await adapter.down(request);
  await adapter.status(request);
  await adapter.logs(request);

  assertEquals(process.calls[0].args, ['compose', '-f', '.deploy/compose/docker-compose.yaml', 'down']);
  assertEquals(process.calls[1].args, ['compose', '-f', '.deploy/compose/docker-compose.yaml', 'ps']);
  assertEquals(process.calls[2].args, [
    'compose',
    '-f',
    '.deploy/compose/docker-compose.yaml',
    'logs',
    '--no-color',
  ]);
});

Deno.test('a non-zero exit surfaces as a thrown error with stderr detail', async () => {
  const process = new FakeProcess();
  process.setResult({ code: 1, stderr: 'boom' });
  const adapter = new AspireComposeDeployTarget({ key: 'compose', process });

  await assertRejects(() => adapter.plan(request), Error, 'boom');
});
