import { assertEquals, assertThrows } from '@std/assert';
import { DatabaseSync } from 'node:sqlite';
import { SAGA_INSTANCE_STATUSES } from '@netscript/plugin-sagas-core/domain';
import { sagaStatusUpgradeRows } from '../../../packages/database/tests/saga-status-upgrade.ts';

Deno.test('pre-fix Prisma rows backfill every lifecycle without changing business data', async () => {
  const sql = await Deno.readTextFile(new URL('./instance-status.migration.sql', import.meta.url));
  // Execute the exact portable data UPDATE; PostgreSQL's DO/constraint is covered in native CI.
  const backfill = sql.slice(0, sql.indexOf('-- PostgreSQL constraint:'));
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(
      "CREATE TABLE saga_instances (id TEXT PRIMARY KEY, state TEXT, is_completed BOOLEAN, status TEXT DEFAULT 'running')",
    );
    const rows = sagaStatusUpgradeRows();
    for (const row of rows) {
      db.prepare('INSERT INTO saga_instances (id, state, is_completed) VALUES (?, ?, ?)').run(
        row.id,
        JSON.stringify(row.state),
        Number(row.is_completed),
      );
    }
    const snapshot = () =>
      db.prepare('SELECT id, state, is_completed FROM saga_instances ORDER BY id').all();
    const before = snapshot();
    const expected = Object.fromEntries(rows.map((row) => [row.id, row.expected]));
    const statuses = () =>
      Object.fromEntries(
        db.prepare('SELECT id, status FROM saga_instances').all().map((
          row,
        ) => [row.id, row.status]),
      );
    assertThrows(() => assertEquals(statuses(), expected));
    db.exec(backfill);
    assertEquals(statuses(), expected);
    assertEquals(snapshot(), before);
    for (const list of sql.matchAll(/IN \(([^)]+)\)/g)) {
      assertEquals(
        list[1].split(',').map((value) => value.trim().slice(1, -1)),
        [...SAGA_INSTANCE_STATUSES],
      );
    }
  } finally {
    db.close();
  }
});
