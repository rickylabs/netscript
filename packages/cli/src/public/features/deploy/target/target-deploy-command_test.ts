import { assertEquals } from 'jsr:@std/assert@^1';

import {
  DeployTargetRegistry,
} from '../../../../kernel/application/registries/deploy-target-registry.ts';
import type {
  DeployTargetOperation,
  DeployTargetPort,
  DeployTargetRequest,
  DeployTargetResult,
} from '../../../../kernel/domain/deploy/deploy-target-port.ts';
import type { PublicCommandDependencies } from '../../root/public-command-dependencies.ts';
import { createTargetDeployCommand } from './target-deploy-command.ts';

interface RecordedOp {
  readonly operation: DeployTargetOperation;
  readonly request: DeployTargetRequest;
}

function fakeTarget(calls: RecordedOp[]): DeployTargetPort {
  const handler = (operation: DeployTargetOperation) => (request: DeployTargetRequest) => {
    calls.push({ operation, request });
    return Promise.resolve<DeployTargetResult>({
      target: 'compose',
      operation,
      message: `${operation} ok`,
    });
  };
  return {
    key: 'compose',
    label: 'Docker Compose',
    operations: ['plan', 'up', 'down', 'status', 'logs'],
    plan: handler('plan'),
    up: handler('up'),
    down: handler('down'),
    status: handler('status'),
    logs: handler('logs'),
  };
}

function fakeDependencies(calls: RecordedOp[]): PublicCommandDependencies {
  const deployTargets = new DeployTargetRegistry([[
    'compose',
    fakeTarget(calls),
  ]]);
  return {
    deployTargets,
    resolveProjectRoot: (projectRoot?: string) => Promise.resolve(projectRoot ?? '/resolved-root'),
    loadConfig: () => Promise.resolve({}),
  } as unknown as PublicCommandDependencies;
}

Deno.test('router derives verb subcommands from the adapter operations (no business logic)', () => {
  const command = createTargetDeployCommand('compose', fakeDependencies([]));
  const verbs = command.getCommands().map((c) => c.getName()).sort();

  assertEquals(verbs, ['down', 'logs', 'plan', 'status', 'up']);
});

Deno.test('router routes a verb straight to the registry-resolved adapter', async () => {
  const calls: RecordedOp[] = [];
  const command = createTargetDeployCommand('compose', fakeDependencies(calls));

  await command.parse([
    'plan',
    '--project-root',
    '/proj',
    '--output-dir',
    '.deploy/compose',
    '--environment',
    'staging',
    '--non-interactive',
  ]);

  assertEquals(calls.length, 1);
  assertEquals(calls[0].operation, 'plan');
  assertEquals(calls[0].request.projectRoot, '/proj');
  assertEquals(calls[0].request.outputDir, '.deploy/compose');
  assertEquals(calls[0].request.environment, 'staging');
  assertEquals(calls[0].request.nonInteractive, true);
});

Deno.test('router forwards cache clearing without target-specific branching', async () => {
  const calls: RecordedOp[] = [];
  const command = createTargetDeployCommand('compose', fakeDependencies(calls));

  await command.parse(['up', '--clear-cache']);

  assertEquals(calls.length, 1);
  assertEquals(calls[0].operation, 'up');
  assertEquals(calls[0].request.projectRoot, '/resolved-root');
  assertEquals(calls[0].request.clearCache, true);
});

Deno.test('router merges target config into the deploy request', async () => {
  const calls: RecordedOp[] = [];
  const deployTargets = new DeployTargetRegistry([['compose', fakeTarget(calls)]]);
  const dependencies = {
    deployTargets,
    resolveProjectRoot: () => Promise.resolve('/resolved-root'),
    loadConfig: () =>
      Promise.resolve({
        aspire: { appHost: 'aspire/apphost.mts' },
        deploy: {
          targets: {
            compose: { outputPath: '.deploy/config-compose' },
          },
        },
      }),
  } as unknown as PublicCommandDependencies;
  const command = createTargetDeployCommand('compose', dependencies);

  await command.parse(['plan']);

  assertEquals(calls[0].request.projectRoot, '/resolved-root');
  assertEquals(calls[0].request.outputDir, '.deploy/config-compose');
  assertEquals(calls[0].request.targetConfig, {
    outputPath: '.deploy/config-compose',
    appHost: 'aspire/apphost.mts',
  });
});

Deno.test('router omits verbs the adapter does not advertise', () => {
  const calls: RecordedOp[] = [];
  const registry = new DeployTargetRegistry([[
    'compose',
    {
      key: 'compose',
      label: 'Docker Compose',
      operations: ['plan'],
      plan: (request: DeployTargetRequest) => {
        calls.push({ operation: 'plan', request });
        return Promise.resolve<DeployTargetResult>({
          target: 'compose',
          operation: 'plan',
          message: 'plan ok',
        });
      },
    },
  ]]);
  const dependencies = {
    deployTargets: registry,
    resolveProjectRoot: () => Promise.resolve('/resolved-root'),
    loadConfig: () => Promise.resolve({}),
  } as unknown as PublicCommandDependencies;

  const command = createTargetDeployCommand('compose', dependencies);
  const verbs = command.getCommands().map((c) => c.getName());

  assertEquals(verbs, ['plan']);
});

Deno.test('router exposes secrets set/get/list and forwards the selected operation', async () => {
  const calls: RecordedOp[] = [];
  const target = fakeTarget(calls);
  const registry = new DeployTargetRegistry([[
    'compose',
    { ...target, operations: [...target.operations, 'secrets'], secrets: (request) => {
      calls.push({ operation: 'secrets', request });
      return Promise.resolve({ target: 'compose', operation: 'secrets', message: 'secrets ok' });
    } },
  ]]);
  const dependencies = {
    deployTargets: registry,
    resolveProjectRoot: () => Promise.resolve('/resolved-root'),
    loadConfig: () => Promise.resolve({}),
  } as unknown as PublicCommandDependencies;
  const command = createTargetDeployCommand('compose', dependencies);
  const secrets = command.getCommands().find((entry) => entry.getName() === 'secrets');
  assertEquals(secrets?.getCommands().map((entry) => entry.getName()).sort(), ['get', 'list', 'set']);

  await command.parse(['secrets', 'set', 'DATABASE_URL', 'secret']);
  assertEquals(calls[0].request.secrets, {
    operation: 'set',
    key: 'DATABASE_URL',
    value: 'secret',
  });
});

Deno.test('deploy target routers resolve their default registry targets', () => {
  const dependencies = {
    deployTargets: new DeployTargetRegistry(),
    resolveProjectRoot: () => Promise.resolve('/resolved-root'),
    loadConfig: () => Promise.resolve({}),
  } as unknown as PublicCommandDependencies;

  for (const key of ['docker', 'compose']) {
    const command = createTargetDeployCommand(key, dependencies);
    const verbs = command.getCommands().map((c) => c.getName()).sort();

    assertEquals(verbs, ['down', 'logs', 'plan', 'status', 'up']);
  }

  for (const key of ['kubernetes', 'azure-aca', 'azure-app-service', 'azure-aks', 'cloud-run']) {
    const command = createTargetDeployCommand(key, dependencies);
    const verbs = command.getCommands().map((c) => c.getName()).sort();

    assertEquals(verbs, ['down', 'plan', 'up']);
  }
});
