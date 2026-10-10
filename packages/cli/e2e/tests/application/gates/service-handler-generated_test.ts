import { assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl, join } from '@std/path';
import { DenoFileSystem } from '../../../../src/kernel/adapters/runtime/file-system/deno-file-system.ts';
import { Scaffolder } from '../../../../src/kernel/adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../../../src/kernel/adapters/scaffold/template-adapter.ts';
import { ServiceScaffolder } from '../../../../src/kernel/adapters/service/scaffolder.ts';
import { addServiceHandler } from '../../../../src/public/features/services/add-handler/add-service-handler.ts';

const REPO_ROOT = fromFileUrl(new URL('../../../../../../', import.meta.url));
const CLI = join(REPO_ROOT, 'packages/cli/bin/netscript-dev.ts');

for (const variant of ['memory', 'prisma'] as const) {
  Deno.test(`add-handler binds and type-checks a real ${variant} ServiceScaffolder project`, async () => {
    await Deno.mkdir(join(REPO_ROOT, '.llm/tmp'), { recursive: true });
    const parent = await Deno.makeTempDir({
      dir: join(REPO_ROOT, '.llm/tmp'),
      prefix: 'handler-proof-',
    });
    const projectName = `handler-${variant}`;
    const projectRoot = join(parent, projectName);
    try {
      await cli([
        'init',
        projectName,
        '--path',
        parent,
        '--db',
        variant === 'prisma' ? 'sqlite' : 'none',
        '--service',
        '--service-name',
        'team-members',
        '--model-name',
        'TeamMember',
        '--ci',
        '--yes',
        '--no-git',
        '--force',
      ]);
      const fs = new DenoFileSystem();
      const templates = new StringTemplateAdapter(fs);
      const scaffolder = new ServiceScaffolder(new Scaffolder(templates, fs), fs, templates);
      await scaffolder.scaffold({
        projectName,
        serviceName: 'team-members',
        modelName: 'TeamMember',
        targetPath: projectRoot,
        servicePort: 3001,
        hasDatabase: variant === 'prisma',
        importMode: 'local',
        localBase: '../..',
        force: true,
      });
      await cli([
        'contract',
        'add-route',
        'team-members',
        'archive',
        '--method',
        'POST',
        '--path',
        '/team-members/archive',
        '--project-root',
        projectRoot,
      ]);
      const routerPath = await addServiceHandler({
        service: 'team-members',
        procedure: 'archive',
        version: 'v1',
        projectRoot,
      }, fs);
      const router = await fs.readFile(routerPath);
      assertStringIncludes(router, 'archive: v1.teamMembers.archive.handler');
      assertStringIncludes(router, "throw new Error('Not implemented: archive')");
      assertStringIncludes(router, '  }),\n  };\n}');
      if (variant === 'prisma') {
        await deno(['task', 'db:generate'], join(projectRoot, 'database/sqlite'));
      } else {
        // Execute the exact quickstart contract → service → handler loop.
        await cli(['contract', 'add', 'orders', '--path', projectRoot]);
        await cli([
          'contract',
          'add-route',
          'orders',
          'recent',
          '--method',
          'GET',
          '--path',
          '/orders/recent',
          '--project-root',
          projectRoot,
        ]);
        await cli([
          'service',
          'add',
          '--name',
          'orders',
          '--with-client',
          '--project-root',
          projectRoot,
        ]);
        await cli(['service', 'add-handler', 'orders', 'recent', '--project-root', projectRoot]);
        assertStringIncludes(
          await fs.readFile(join(projectRoot, 'services/orders/src/routers/v1.ts')),
          'recent: v1.orders.recent.handler',
        );
        const contractConfig = JSON.parse(
          await fs.readFile(join(projectRoot, 'contracts/deno.json')),
        );
        await fs.writeFile(
          join(projectRoot, 'services/team-members/src/routers/missing-record_test.ts'),
          `
import { call, ORPCError } from '${contractConfig.imports['@orpc/server']}';
import { createTeamMembersApplication } from '../application/team-members.ts';
import { createMemoryTeamMembersRepository } from '../adapters/memory-team-members-repository.ts';
import { createTeamMembersV1 } from './v1.ts';
Deno.test('missing memory record maps to typed NOT_FOUND with status 404', async () => {
  const application = createTeamMembersApplication(createMemoryTeamMembersRepository());
  if (await application.updateStatus({ id: 999, status: 'archived' }) !== null) {
    throw new Error('Application must preserve repository absence');
  }
  const router = createTeamMembersV1(application);
  try {
    await call(router.updateStatus, { id: 999, status: 'archived' });
  } catch (error) {
    if (error instanceof ORPCError && error.code === 'NOT_FOUND' && error.status === 404 &&
      error.data.resourceId === 999) return;
    throw error;
  }
  throw new Error('Missing record must reject');
});
`,
        );
      }
      await deno(['task', 'check'], join(projectRoot, 'services/team-members'));
      if (variant === 'memory') {
        await deno(['task', 'check'], join(projectRoot, 'services/orders'));
        await deno(['check', `apps/${projectName}-web/lib/orders.ts`], projectRoot);
      }
      await deno(['task', 'test'], join(projectRoot, 'services/team-members'));
    } finally {
      await Deno.remove(parent, { recursive: true });
    }
  });
}

async function cli(args: string[]): Promise<void> {
  await deno(['run', '-A', CLI, ...args], REPO_ROOT);
}

async function deno(args: string[], cwd: string): Promise<void> {
  const output = await new Deno.Command(Deno.execPath(), {
    args,
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const decoder = new TextDecoder();
  assertEquals(
    output.code,
    0,
    `${decoder.decode(output.stderr)}\n${decoder.decode(output.stdout)}`,
  );
}
