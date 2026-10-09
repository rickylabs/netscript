import { assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1';

import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';
import type { DbOperationRequest, DiscoveredDatabase } from '../../domain/db-engine.ts';
import {
  type DenoTaskSpawner,
  DbWorkspaceTaskRunner,
  resolveDbTaskOperation,
} from './workspace-task-runner.ts';

const POSTGRES: DiscoveredDatabase = {
  configKey: 'postgres',
  engine: 'postgres',
  databaseName: 'app-db',
  workspaceDir: 'database/postgres',
  enabled: true,
};
const SQLITE: DiscoveredDatabase = {
  configKey: 'sqlite',
  engine: 'sqlite',
  databaseName: 'app.db',
  workspaceDir: 'database/sqlite',
  enabled: true,
};

interface SpawnCall {
  readonly task: string;
  readonly cwd: string;
  readonly env: Record<string, string>;
}

function recordingSpawner(codes: readonly number[] = []): {
  readonly calls: SpawnCall[];
  readonly spawn: DenoTaskSpawner;
} {
  const calls: SpawnCall[] = [];
  return {
    calls,
    spawn: (task, options) => {
      calls.push({ task, cwd: options.cwd, env: options.env });
      return Promise.resolve(codes[calls.length - 1] ?? 0);
    },
  };
}

async function workspaceWithTasks(
  ...entries: readonly [string, readonly string[]][]
): Promise<MemoryFileSystemAdapter> {
  const fs = new MemoryFileSystemAdapter();
  for (const [workspaceDir, tasks] of entries) {
    await fs.writeFile(
      `/project/${workspaceDir}/deno.json`,
      JSON.stringify({ tasks: Object.fromEntries(tasks.map((task) => [task, 'deno run x.ts'])) }),
    );
  }
  return fs;
}

function request(overrides: Partial<DbOperationRequest> = {}): DbOperationRequest {
  return {
    operation: 'seed',
    target: { kind: 'single', database: POSTGRES },
    projectRoot: '/project',
    interactive: false,
    ...overrides,
  };
}

Deno.test('resolveDbTaskOperation mirrors the AppHost migrate mapping', () => {
  assertEquals(resolveDbTaskOperation('migrate'), 'deploy');
  assertEquals(resolveDbTaskOperation('migrate', 'add-users'), 'migrate');
  assertEquals(resolveDbTaskOperation('seed'), 'seed');
  assertEquals(resolveDbTaskOperation('generate'), 'generate');
});

Deno.test('DbWorkspaceTaskRunner runs the engine task in the database workspace', async () => {
  const fs = await workspaceWithTasks(['database/postgres', ['db:seed:postgres']]);
  const spawner = recordingSpawner();

  const code = await new DbWorkspaceTaskRunner(fs, spawner.spawn).execute(request());

  assertEquals(code, 0);
  assertEquals(spawner.calls, [{
    task: 'db:seed:postgres',
    cwd: '/project/database/postgres',
    env: {
      NETSCRIPT_PRISMA_OPERATION: 'seed',
      NETSCRIPT_PRISMA_TARGET: 'postgres',
      NETSCRIPT_MIGRATION_INTERACTIVE: 'false',
    },
  }]);
});

Deno.test('DbWorkspaceTaskRunner passes the migration name and keeps migrate semantics', async () => {
  const fs = await workspaceWithTasks([
    'database/postgres',
    ['db:migrate:postgres', 'db:deploy:postgres'],
  ]);
  const spawner = recordingSpawner();
  const runner = new DbWorkspaceTaskRunner(fs, spawner.spawn);

  await runner.execute(request({ operation: 'migrate', migrationName: 'add-users' }));
  await runner.execute(request({ operation: 'migrate' }));

  assertEquals(spawner.calls.map((call) => call.task), [
    'db:migrate:postgres',
    'db:deploy:postgres',
  ]);
  assertEquals(spawner.calls[0].env.PRISMA_MIGRATION_NAME, 'add-users');
  assertEquals(spawner.calls[1].env.PRISMA_MIGRATION_NAME, undefined);
});

Deno.test('DbWorkspaceTaskRunner stops at the first failing database', async () => {
  const fs = await workspaceWithTasks(
    ['database/postgres', ['db:generate:postgres']],
    ['database/sqlite', ['db:generate:sqlite']],
  );
  const spawner = recordingSpawner([3, 0]);

  const code = await new DbWorkspaceTaskRunner(fs, spawner.spawn).execute(request({
    operation: 'generate',
    target: { kind: 'all', databases: [POSTGRES, SQLITE] },
  }));

  assertEquals(code, 3);
  assertEquals(spawner.calls.map((call) => call.task), ['db:generate:postgres']);
});

Deno.test('DbWorkspaceTaskRunner opens studio for the first target only', async () => {
  const fs = await workspaceWithTasks(
    ['database/postgres', ['db:studio:postgres']],
    ['database/sqlite', ['db:studio:sqlite']],
  );
  const spawner = recordingSpawner();

  await new DbWorkspaceTaskRunner(fs, spawner.spawn).execute(request({
    operation: 'studio',
    target: { kind: 'all', databases: [POSTGRES, SQLITE] },
  }));

  assertEquals(spawner.calls.map((call) => call.task), ['db:studio:postgres']);
});

Deno.test('DbWorkspaceTaskRunner refuses with the remedy when the workspace task is missing', async () => {
  for (const fs of [
    new MemoryFileSystemAdapter(),
    await workspaceWithTasks(['database/postgres', ['db:generate:postgres']]),
  ]) {
    const spawner = recordingSpawner();
    const error = await assertRejects(
      () => new DbWorkspaceTaskRunner(fs, spawner.spawn).execute(request()),
      ScaffoldValidationError,
    );
    assertStringIncludes(error.message, 'no Aspire AppHost');
    assertStringIncludes(error.message, "'deno task --cwd database/postgres db:seed:postgres'");
    assertStringIncludes(error.message, 'POSTGRES_URI or DATABASE_URL');
    assertEquals(spawner.calls, []);
  }
});
