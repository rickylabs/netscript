/** Legacy-row fixtures and upgrade assertions shared by the installed-schema conformance gate. */
import { assertEquals } from '@std/assert';
import { join } from '@std/path';
import { SAGA_INSTANCE_STATUSES } from '@netscript/plugin-sagas-core/domain';
import type { SagaInstanceStatus } from '@netscript/plugin-sagas-core/domain';
import { runMigrationWithArtifacts } from '../scripts/migrate.ts';
import { pendingPluginMigrations } from '../scripts/plugin-migrations.ts';

/** Pre-fix JSON/boolean combinations, including conflicting business and lifecycle fields. */
export function sagaStatusUpgradeRows(): ReadonlyArray<{
  id: string;
  state: Record<string, unknown>;
  is_completed: boolean;
  expected: SagaInstanceStatus;
}> {
  return [
    ...SAGA_INSTANCE_STATUSES.flatMap((status) => [
      {
        id: `flat-${status}`,
        state: { status, customer: 'untouched' },
        is_completed: status === 'completed',
        expected: status,
      },
      {
        id: `v2-${status}`,
        state: {
          projectionVersion: 2,
          status,
          state: { status: 'business', customer: 'untouched' },
        },
        is_completed: true,
        expected: status,
      },
    ]),
    {
      id: 'flat-completed-flag',
      state: { status: 'failed' },
      is_completed: true,
      expected: 'completed',
    },
    {
      id: 'flat-unknown',
      state: { status: 'payment_pending' },
      is_completed: false,
      expected: 'running',
    },
    {
      id: 'flat-missing',
      state: { customer: 'untouched' },
      is_completed: false,
      expected: 'running',
    },
  ];
}

/** Seed an old schema, then upgrade through the real application migration runner. */
export async function verifySagaStatusUpgrade(options: {
  schemaPath: string;
  migrationsPath: string;
  configPath: string;
  installed: readonly { name: string; content: string }[];
  prisma: (args: string[]) => Promise<string>;
  sql: (query: string, success?: boolean) => Promise<string>;
}): Promise<void> {
  const { schemaPath, migrationsPath, configPath, installed, prisma, sql } = options;
  const columnCount =
    "SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'saga_instances' AND column_name = 'status'";
  assertEquals(await sql(columnCount), '0', 'Upgrade must start without the new status column');
  const rows = sagaStatusUpgradeRows();
  await sql(`INSERT INTO saga_instances
    (id, saga_name, correlation_id, version, is_completed, state, created_at, updated_at)
    SELECT id, 'status-upgrade', id, 17, is_completed, state,
      TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-02-01 00:00:00'
    FROM json_to_recordset($seed$${JSON.stringify(rows)}$seed$)
      AS x(id text, state json, is_completed boolean)`);
  const snapshot = `SELECT json_agg(t ORDER BY id)::text FROM (
    SELECT id, saga_name, correlation_id, version, is_completed, state, created_at, updated_at
    FROM saga_instances WHERE saga_name = 'status-upgrade') t`;
  const before = JSON.parse(await sql(snapshot));
  const sidecar = installed.find((file) => file.name.endsWith('instance-status.migration.sql'));
  assertEquals(Boolean(sidecar), true, 'Installed plugin must include the new migration');
  for (const file of installed) await Deno.writeTextFile(join(schemaPath, file.name), file.content);
  const sidecarPath = join(schemaPath, sidecar!.name);
  // Opt-in negative control: the same real upgrade must fail its row assertions without backfill.
  const negative = Deno.env.get('SAGA_STATUS_NEGATIVE_CONTROL') === '1';
  if (negative) await Deno.writeTextFile(sidecarPath, '');
  try {
    const commands: string[] = [];
    const result = await runMigrationWithArtifacts({
      provider: 'postgres',
      configPath,
      schemaPath,
      migrationsPath,
      migrationName: 'saga_instance_status',
      interactive: false,
      verbose: false,
      async spawn(args) {
        commands.push(args[1]);
        if (args[1] === 'dev') assertEquals(args.includes('--create-only'), true);
        await prisma([...args]);
        return { code: 0, stderr: '' };
      },
    });
    assertEquals(result.code, 0);
    assertEquals(await sql(columnCount), '1', 'Migration must add the scalar status column');
    assertEquals(result.created.length, 1);
    assertEquals(result.applied, result.created);
    assertEquals(commands, ['dev', 'deploy', 'status']);
    const statuses = JSON.parse(
      await sql(
        "SELECT json_object_agg(id, status)::text FROM saga_instances WHERE saga_name = 'status-upgrade'",
      ),
    );
    assertEquals(statuses, Object.fromEntries(rows.map((row) => [row.id, row.expected])));
    assertEquals(JSON.parse(await sql(snapshot)), before, 'Backfill must only change status');
    await sql(
      "UPDATE saga_instances SET status = 'not-canonical' WHERE id = 'flat-running'",
      false,
    );
    assertEquals(await pendingPluginMigrations(schemaPath, migrationsPath), []);
    // Existing conditional constraints must be safe for adoption too.
    await sql(sidecar!.content);
    assertEquals(JSON.parse(await sql(snapshot)), before);
  } finally {
    if (negative) await Deno.writeTextFile(sidecarPath, sidecar!.content);
  }
}
