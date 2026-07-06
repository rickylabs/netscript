import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { join } from '@std/path';

import { InMemoryScaffolder } from '../testing/in-memory-scaffolder.ts';
import { DeployTargetRegistry } from '../registries/deploy-target-registry.ts';
import type {
  DeployTargetOperation,
  DeployTargetPort,
  DeployTargetRequest,
  DeployTargetResult,
} from '../../domain/deploy/deploy-target-port.ts';
import type { DenoDeployTargetDefaults } from '../../domain/deploy/deno-deploy-target.ts';
import type { ValidatedInitOptions } from '../../domain/scaffold/scaffold-options.ts';
import type { BuildResult } from '../../domain/deploy/compile-target.ts';
import type { ResolvedConfig } from '../../domain/resolved-config.ts';
import type { PublicCommandDependencies } from '../../../public/features/root/public-command-dependencies.ts';
import { createDeployCommand } from '../../../public/features/deploy/deploy-group.ts';
import type { InitPipelineContext } from './context.ts';
import { scaffoldRoot } from './plan-init.ts';

function options(
  overrides: Partial<ValidatedInitOptions> = {},
): ValidatedInitOptions {
  return {
    name: 'deploy-app',
    appName: 'dashboard',
    targetPath: '/workspace/deploy-app',
    importMode: 'jsr',
    editor: 'none',
    force: false,
    ci: true,
    dryRun: false,
    noGit: true,
    noAspire: false,
    legacyAspire: false,
    dbEngine: 'none',
    cache: true,
    cacheBackend: 'redis',
    includeExampleService: false,
    modelName: 'User',
    ...overrides,
  };
}

function context(scaffolder: InMemoryScaffolder): InitPipelineContext {
  return {
    scaffolder,
    packagesAsWorkspaceMembers: () => false,
  } as unknown as InitPipelineContext;
}

function fakeDeployTarget(key: string): DeployTargetPort {
  const handler =
    (operation: DeployTargetOperation) =>
    (_request: DeployTargetRequest): Promise<DeployTargetResult> =>
      Promise.resolve({ target: key, operation, message: `${key} ${operation} ok` });
  return {
    key,
    label: key,
    operations: ['plan', 'up', 'down', 'status', 'logs'],
    plan: handler('plan'),
    up: handler('up'),
    down: handler('down'),
    status: handler('status'),
    logs: handler('logs'),
  };
}

function fakeDeployDependencies(): PublicCommandDependencies {
  const buildResult: BuildResult = {
    success: true,
    outputDir: '.deploy',
    compilations: [],
    durationMs: 0,
    errors: [],
  };
  return {
    deployBuildDependencies: {
      loadConfig: () => Promise.resolve({} as ResolvedConfig),
      buildWindowsDeployment: () => Promise.resolve(buildResult),
    },
    loadConfig: () => Promise.resolve({ deploy: {} }),
    resolveProjectRoot: (projectRoot?: string) => Promise.resolve(projectRoot ?? '/workspace'),
    manifestPort: {
      resolve: () => Promise.reject(new Error('manifest resolution is not used by this test')),
    },
    osServices: {},
    deployTargets: new DeployTargetRegistry([
      ['compose', fakeDeployTarget('compose')],
      ['docker', fakeDeployTarget('docker')],
    ]),
    denoDeployTargetFactory: (_defaults: DenoDeployTargetDefaults) =>
      fakeDeployTarget('deno-deploy'),
  } as unknown as PublicCommandDependencies;
}

function shellWords(input: string): string[] {
  const words: string[] = [];
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g;
  for (const match of input.matchAll(pattern)) {
    words.push(match[1] ?? match[2] ?? match[3]);
  }
  return words;
}

function extractDeployInvocations(workflow: string): string[][] {
  const invocations: string[][] = [];
  const lines = workflow.split(/\r?\n/);
  let shellArgs: string[] | undefined;
  const optionalShellArgs: string[] = [];

  for (let index = 0; index < lines.length; index++) {
    const trimmed = lines[index].trim();
    if (trimmed === 'args=(') {
      shellArgs = [];
      for (index++; index < lines.length; index++) {
        const argLine = lines[index].trim();
        if (argLine === ')') break;
        shellArgs.push(...shellWords(argLine));
      }
      continue;
    }

    if (trimmed.startsWith('args+=(') && trimmed.endsWith(')')) {
      optionalShellArgs.push(...shellWords(trimmed.slice('args+=('.length, -1)));
      continue;
    }

    if (trimmed === 'deno x -A jsr:@netscript/cli "${args[@]}"') {
      if (!shellArgs) throw new Error('Found args invocation before args array declaration.');
      invocations.push(shellArgs);
      if (optionalShellArgs.length > 0) {
        invocations.push([...shellArgs, ...optionalShellArgs]);
      }
      continue;
    }

    if (!trimmed.startsWith('deno x -A jsr:@netscript/cli ')) continue;

    const commandLines = [trimmed];
    for (let cursor = index + 1; cursor < lines.length; cursor++) {
      const continuation = lines[cursor].trim();
      if (continuation === '') break;
      commandLines.push(continuation);
      index = cursor;
    }
    invocations.push(shellWords(commandLines.join(' ')).slice(4));
  }

  return invocations.filter((args) => args[0] === 'deploy');
}

Deno.test('scaffoldRoot emits CI/CD workflow templates for shipped deploy targets', async () => {
  const scaffolder = new InMemoryScaffolder();
  const result = await scaffoldRoot(context(scaffolder), options());
  const workflowsRoot = join('/workspace/deploy-app', '.github', 'workflows');
  const composePath = join(workflowsRoot, 'deploy-compose-ghcr.yml');
  const denoDeployPath = join(workflowsRoot, 'deploy-deno-deploy.yml');
  const bareMetalPath = join(workflowsRoot, 'deploy-bare-metal.yml');

  assert(result.filesCreated.includes(composePath));
  assert(result.filesCreated.includes(denoDeployPath));
  assert(result.filesCreated.includes(bareMetalPath));

  const compose = scaffolder.files.get(composePath);
  const denoDeploy = scaffolder.files.get(denoDeployPath);
  const bareMetal = scaffolder.files.get(bareMetalPath);

  assertStringIncludes(compose ?? '', 'deploy compose plan');
  assertStringIncludes(compose ?? '', '--clear-cache');
  assertStringIncludes(compose ?? '', 'ghcr.io');
  assert(!compose?.includes('~/.aspire/deployments'));

  assertStringIncludes(denoDeploy ?? '', 'deploy deno-deploy up');
  assertStringIncludes(denoDeploy ?? '', 'DENO_DEPLOY_TOKEN');

  assertStringIncludes(bareMetal ?? '', 'deploy build');
  assertStringIncludes(bareMetal ?? '', '--output-dir');
  assertStringIncludes(bareMetal ?? '', 'actions/upload-artifact');
  assertEquals(scaffolder.directories.has('/workspace/deploy-app'), true);
});

Deno.test('scaffoldRoot emits deploy workflow invocations accepted by the real deploy parser', async () => {
  const scaffolder = new InMemoryScaffolder();
  await scaffoldRoot(context(scaffolder), options());
  const workflowContents = [...scaffolder.files.entries()]
    .filter(([path]) => path.includes('/.github/workflows/'))
    .map(([, content]) => content);
  const invocations = workflowContents.flatMap(extractDeployInvocations);

  assertEquals(invocations, [
    [
      'deploy',
      'compose',
      'plan',
      '--project-root',
      '.',
      '--output-dir',
      '.deploy/compose',
      '--environment',
      '$DEPLOY_ENVIRONMENT',
      '--non-interactive',
    ],
    [
      'deploy',
      'docker',
      'up',
      '--project-root',
      '.',
      '--environment',
      '$DEPLOY_ENVIRONMENT',
      '--clear-cache',
      '--non-interactive',
    ],
    [
      'deploy',
      'deno-deploy',
      'up',
      '--org',
      '$DENO_DEPLOY_ORG',
      '--app',
      '$DENO_DEPLOY_APP',
    ],
    [
      'deploy',
      'deno-deploy',
      'up',
      '--org',
      '$DENO_DEPLOY_ORG',
      '--app',
      '$DENO_DEPLOY_APP',
      '--prod',
    ],
    ['deploy', 'build', '--output-dir', '${{ matrix.deploy_dir }}'],
  ]);

  for (const args of invocations) {
    const command = createDeployCommand(fakeDeployDependencies()).noExit().throwErrors();
    await command.parse(args.slice(1));
  }
});

Deno.test('scaffoldRoot omits Aspire-backed compose CI when --no-aspire is used', async () => {
  const scaffolder = new InMemoryScaffolder();
  const result = await scaffoldRoot(
    context(scaffolder),
    options({ noAspire: true }),
  );
  const workflowsRoot = join('/workspace/deploy-app', '.github', 'workflows');

  assert(
    !result.filesCreated.includes(
      join(workflowsRoot, 'deploy-compose-ghcr.yml'),
    ),
  );
  assert(
    result.filesCreated.includes(join(workflowsRoot, 'deploy-deno-deploy.yml')),
  );
  assert(
    result.filesCreated.includes(join(workflowsRoot, 'deploy-bare-metal.yml')),
  );
});
