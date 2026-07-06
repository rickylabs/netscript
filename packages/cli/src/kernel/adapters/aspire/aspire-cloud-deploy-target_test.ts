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

const kubernetesAppHost =
  'const env = builder.addKubernetesEnvironment("prod"); api.publishAsKubernetesService(env);';

const request = {
  projectRoot: '/proj',
  outputDir: '.deploy/kubernetes',
  targetConfig: { appHost: 'aspire/apphost.mts' },
} as const;

Deno.test('kubernetes adapter declares an Aspire-owned operation subset', () => {
  const process = new FakeProcess();
  const adapter: DeployTargetPort = new AspireCloudDeployTarget({ key: 'kubernetes', process });

  assertEquals(adapter.key, 'kubernetes');
  assertEquals(adapter.label, 'Kubernetes');
  assertEquals(adapter.operations, ['plan', 'emit', 'up', 'down']);
  assertEquals(adapter.rollback, undefined);
  assertEquals(adapter.secrets, undefined);
});

Deno.test('plan/emit validate AppHost markers and delegate without platform --environment', async () => {
  const process = new FakeProcess();
  const adapter = new AspireCloudDeployTarget({
    key: 'kubernetes',
    process,
    readAppHost: () => Promise.resolve(kubernetesAppHost),
  });

  await adapter.plan(request);
  await adapter.emit(request);

  assertEquals(process.calls[0], {
    command: 'aspire',
    args: [
      'publish',
      '--apphost',
      '/proj/aspire/apphost.mts',
      '--output-path',
      '.deploy/kubernetes',
      '--non-interactive',
    ],
    cwd: '/proj',
  });
  assertEquals(process.calls[1].args, process.calls[0].args);
});

Deno.test('up uses configured AppHost and outputPath from request config', async () => {
  const process = new FakeProcess();
  const adapter = new AspireCloudDeployTarget({
    key: 'azure-aks',
    process,
    readAppHost: () => Promise.resolve('builder.addAzureKubernetesEnvironment("prod");'),
  });

  await adapter.up({
    projectRoot: '/proj',
    targetConfig: {
      appHost: 'ops/apphost.mts',
      outputPath: '.deploy/prod-aks',
    },
  });

  assertEquals(process.calls[0].args, [
    'deploy',
    '--apphost',
    '/proj/ops/apphost.mts',
    '--output-path',
    '.deploy/prod-aks',
    '--non-interactive',
  ]);
});

Deno.test('AppHost validation rejects a mismatched platform before invoking Aspire', async () => {
  const process = new FakeProcess();
  const adapter = new AspireCloudDeployTarget({
    key: 'azure-aca',
    process,
    readAppHost: () => Promise.resolve('builder.addKubernetesEnvironment("prod");'),
  });

  await assertRejects(
    () => adapter.plan({ projectRoot: '/proj', targetConfig: { appHost: 'aspire/apphost.mts' } }),
    Error,
    'requires the AppHost to define the matching platform integration',
  );
  assertEquals(process.calls.length, 0);
});

Deno.test('cloud-run up builds, pushes, and deploys the configured image', async () => {
  const process = new FakeProcess();
  const adapter = new AspireCloudDeployTarget({ key: 'cloud-run', process });

  await adapter.up({
    projectRoot: '/proj',
    targetConfig: {
      registry: 'us-docker.pkg.dev/acme',
      imageName: 'orders-api:latest',
    },
  });

  assertEquals(process.calls, [
    {
      command: 'docker',
      args: ['build', '-t', 'us-docker.pkg.dev/acme/orders-api:latest', '.'],
      cwd: '/proj',
    },
    {
      command: 'docker',
      args: ['push', 'us-docker.pkg.dev/acme/orders-api:latest'],
      cwd: '/proj',
    },
    {
      command: 'gcloud',
      args: [
        'run',
        'deploy',
        'orders-api',
        '--image',
        'us-docker.pkg.dev/acme/orders-api:latest',
        '--quiet',
      ],
      cwd: '/proj',
    },
  ]);
});

Deno.test('cloud-run down deletes the configured service', async () => {
  const process = new FakeProcess();
  const adapter = new AspireCloudDeployTarget({ key: 'cloud-run', process });

  await adapter.down({
    projectRoot: '/proj',
    targetConfig: {
      registry: 'us-docker.pkg.dev/acme',
      imageName: 'orders-api:latest',
    },
  });

  assertEquals(process.calls[0].args, [
    'run',
    'services',
    'delete',
    'orders-api',
    '--quiet',
  ]);
});

Deno.test('cloud-run requires registry and imageName config', async () => {
  const process = new FakeProcess();
  const adapter = new AspireCloudDeployTarget({ key: 'cloud-run', process });

  await assertRejects(
    () => adapter.up({ projectRoot: '/proj' }),
    Error,
    "deploy.targets['cloud-run'].registry and imageName",
  );
  assertEquals(process.calls.length, 0);
});

Deno.test('a non-zero external CLI exit surfaces stderr detail', async () => {
  const process = new FakeProcess();
  process.setResult({ code: 2, stderr: 'missing AppHost' });
  const adapter = new AspireCloudDeployTarget({
    key: 'azure-aks',
    process,
    readAppHost: () => Promise.resolve('builder.addAzureKubernetesEnvironment("prod");'),
  });

  await assertRejects(() => adapter.plan(request), Error, 'missing AppHost');
});
