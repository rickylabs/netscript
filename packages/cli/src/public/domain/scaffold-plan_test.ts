import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals } from 'jsr:@std/assert@^1';
import type { ValidatedInitOptions } from '../../kernel/domain/scaffold/scaffold-options.ts';
import { createScaffoldPlan } from './scaffold-plan.ts';

function makeOptions(overrides: Partial<ValidatedInitOptions> = {}): ValidatedInitOptions {
  return {
    name: 'alpha-app',
    appName: 'dashboard',
    targetPath: '/tmp/alpha-app',
    importMode: 'jsr',
    editor: 'none',
    force: false,
    ci: true,
    dryRun: false,
    noGit: true,
    noAspire: true,
    dbEngine: 'none',
    cache: true,
    cacheBackend: 'redis',
    includeExampleService: false,
    modelName: 'User',
    ...overrides,
  };
}

describe('createScaffoldPlan', () => {
  it('builds the base workspace member list', () => {
    const plan = createScaffoldPlan(makeOptions(), { useWorkspacePackages: false });

    assertEquals(plan.workspaceMembers, ['apps/dashboard', 'contracts', 'plugins']);
    assertEquals(plan.dbEngines, []);
    assertEquals(plan.service, undefined);
  });

  it('includes service and database members when selected', () => {
    const plan = createScaffoldPlan(
      makeOptions({
        dbEngine: 'postgres',
        includeExampleService: true,
        serviceName: 'team-members',
        servicePort: 3000,
      }),
      { useWorkspacePackages: true },
    );

    assertEquals(plan.workspaceMembers, [
      'apps/dashboard',
      'contracts',
      'plugins',
      'services/team-members',
      'database/postgres',
    ]);
    assertEquals(plan.dbEngines, ['postgres']);
    assertEquals(plan.service, { name: 'team-members', port: 3000 });
    assertEquals(plan.useWorkspacePackages, true);
  });
});
