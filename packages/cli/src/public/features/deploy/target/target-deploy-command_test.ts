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
  const deployTargets = new DeployTargetRegistry([['compose', fakeTarget(calls)]]);
  return {
    deployTargets,
    resolveProjectRoot: (projectRoot?: string) => Promise.resolve(projectRoot ?? '/resolved-root'),
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

  await command.parse(['plan', '--project-root', '/proj', '--output-dir', '.deploy/compose']);

  assertEquals(calls.length, 1);
  assertEquals(calls[0].operation, 'plan');
  assertEquals(calls[0].request.projectRoot, '/proj');
  assertEquals(calls[0].request.outputDir, '.deploy/compose');
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
  } as unknown as PublicCommandDependencies;

  const command = createTargetDeployCommand('compose', dependencies);
  const verbs = command.getCommands().map((c) => c.getName());

  assertEquals(verbs, ['plan']);
});

Deno.test('deploy docker/compose routers resolve their default registry targets', () => {
  const dependencies = {
    deployTargets: new DeployTargetRegistry(),
    resolveProjectRoot: () => Promise.resolve('/resolved-root'),
  } as unknown as PublicCommandDependencies;

  for (const key of ['docker', 'compose']) {
    const command = createTargetDeployCommand(key, dependencies);
    const verbs = command.getCommands().map((c) => c.getName()).sort();

    assertEquals(verbs, ['down', 'logs', 'plan', 'status', 'up']);
  }
});
