import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';

import type { ProcessPort, ProcessResult } from '../../ports/process-port.ts';
import type { DeployTargetPort } from '../../domain/deploy/deploy-target-port.ts';
import { AspireCloudDeployTarget } from './aspire-cloud-deploy-target.ts';

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

const request = { projectRoot: '/proj', outputDir: '.deploy/kubernetes' } as const;

Deno.test('kubernetes adapter declares an Aspire-owned operation subset', () => {
  const process = new FakeProcess();
  const adapter: DeployTargetPort = new AspireCloudDeployTarget({ key: 'kubernetes', process });

  assertEquals(adapter.key, 'kubernetes');
  assertEquals(adapter.label, 'Kubernetes');
  assertEquals(adapter.operations, ['plan', 'emit', 'up', 'down']);
  assertEquals(adapter.rollback, undefined);
  assertEquals(adapter.secrets, undefined);
});

Deno.test('plan/emit delegate to aspire publish with the k8s environment', async () => {
  const process = new FakeProcess();
  const adapter = new AspireCloudDeployTarget({ key: 'kubernetes', process });

  await adapter.plan(request);
  await adapter.emit(request);

  assertEquals(process.calls[0], {
    command: 'aspire',
    args: [
      'publish',
      '--environment',
      'k8s',
      '--output-path',
      '.deploy/kubernetes',
      '--non-interactive',
    ],
    cwd: '/proj',
  });
  assertEquals(process.calls[1].args, process.calls[0].args);
});

Deno.test('up delegates to aspire deploy with the configured environment', async () => {
  const process = new FakeProcess();
  const adapter = new AspireCloudDeployTarget({
    key: 'azure-aca',
    environment: 'prod-aca',
    process,
  });

  await adapter.up({ projectRoot: '/proj' });

  assertEquals(process.calls[0].args, [
    'deploy',
    '--environment',
    'prod-aca',
    '--output-path',
    '.deploy/azure-aca',
    '--non-interactive',
  ]);
});

Deno.test('down delegates to aspire destroy with confirmation suppressed', async () => {
  const process = new FakeProcess();
  const adapter = new AspireCloudDeployTarget({ key: 'cloud-run', process });

  await adapter.down({ projectRoot: '/proj', outputDir: '.deploy/cloud-run' });

  assertEquals(process.calls[0].args, [
    'destroy',
    '--environment',
    'cloud-run',
    '--output-path',
    '.deploy/cloud-run',
    '--yes',
    '--non-interactive',
  ]);
});

Deno.test('a non-zero Aspire exit surfaces stderr detail', async () => {
  const process = new FakeProcess();
  process.setResult({ code: 2, stderr: 'missing environment' });
  const adapter = new AspireCloudDeployTarget({ key: 'azure-aks', process });

  await assertRejects(() => adapter.plan(request), Error, 'missing environment');
});
