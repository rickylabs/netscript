import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { join } from '@std/path';

import { InMemoryScaffolder } from '../testing/in-memory-scaffolder.ts';
import type { ValidatedInitOptions } from '../../domain/scaffold/scaffold-options.ts';
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

  assertStringIncludes(compose ?? '', 'deploy compose emit');
  assertStringIncludes(compose ?? '', '--clear-cache');
  assertStringIncludes(compose ?? '', 'ghcr.io');
  assert(!compose?.includes('~/.aspire/deployments'));

  assertStringIncludes(denoDeploy ?? '', 'deploy deno-deploy up');
  assertStringIncludes(denoDeploy ?? '', 'DENO_DEPLOY_TOKEN');

  assertStringIncludes(bareMetal ?? '', 'deploy build');
  assertStringIncludes(bareMetal ?? '', 'actions/upload-artifact');
  assertEquals(scaffolder.directories.has('/workspace/deploy-app'), true);
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
